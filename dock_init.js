


class Dock_Init
{
	constructor(bJumptoBoot) {	
		this. bStartProcess = false;
		this.bJumptoBoot = bJumptoBoot;
		
		this.bMCU_Control_InitOK = false;
		this.SendFWInfo_Num = 255;
		this.m_VersionNeedUpdate = false;
		
		this.m_VersionSpareCnt = 0;
		
		this.m_DeviceIspMode = 0;
		
		
		this.readfile_TotalCount = 0;
		this.bPassFlag = true;
		
		//this.bEndWork = new Boolean(1);
		this.bEndWork = false;
		this.bUpdateFW_Done = false;
		
		this.u16_CheckSum = new Uint16Array(1);
		this.u16_CheckSum[0] = 0;
		
		this.u32_m_sequense = new Uint32Array(1);
		this.u32_m_sequense[0] = 0;
		
		this.FW_Order = ISP_BIN_FILE_SEQUENCE.BIN_MCU;
	}
	
	
	ISPModeCheckMode() {
		logOutput("ISPMode - Check Mode!");
		
		var bytes = new Uint8Array(255);

		for (var i = 0; i < 255; i++) {
			bytes[i] = 0;
		}

		bytes[0] = 3;
		bytes[1] = 0xfe;
		bytes[2] = 0xff;
		bytes[3] = USBUID_ISP_MCU_CMD.USBUID_ISP_MCU_CMD_DEVICE_STATUS;

		bytes[254] = 0x5a;	
		
		HID_device[0].sendReport(sentReportId, bytes).then( () => {
			//logOutput("***Sent Report***");
			//logOutput_bytes(bytes, true);		
		});
	};

	ISPModeGetSpareArea(index) {
		//logOutput("ISPMode - Get Spare Area");
		
		var bytes = new Uint8Array(255);

		for (var i = 0; i < 255; i++) {
			bytes[i] = 0;
		}

		bytes[0] = 3;
		bytes[1] = 0xfe;
		bytes[2] = 0xff;
		bytes[3] = USBUID_ISP_MCU_CMD.USBUID_ISP_MCU_CMD_GET_SPARE_AREA;
		bytes[4] = index;

		bytes[254] = 0x5a;	
		
		HID_device[0].sendReport(sentReportId, bytes).then( () => {
			//logOutput("***Sent Report***");
			//logOutput_bytes(bytes, true);		
		});
	};	


	ISPModeCheckVersion() {
		logOutput("ISPMode - Check Version");
		
		var bytes = new Uint8Array(255);

		for (var i = 0; i < 255; i++) {
			bytes[i] = 0;
		}

		bytes[0] = 3;
		bytes[1] = 0xfe;
		bytes[2] = 0xff;
		bytes[3] = USBUID_ISP_MCU_CMD.USBUID_ISP_MCU_CMD_DEVICE_VERSION;

		bytes[254] = 0x5a;	
		
		HID_device[0].sendReport(sentReportId, bytes).then( () => {
			//logOutput("***Sent Report***");
			//logOutput_bytes(bytes, true);		
		});
	};
	
	/////////////////////////
	//for MCU AP code update
	/////////////////////////
	StartUpdate() {
		
		this.bStartProcess = true;
		
		if ( (FW_Option[0] & (0x01 << this.FW_Order)) === 0)
		{
			logOutput("Skip updating MCU Firmware..." +　(FW_Option[0] & (0x01 << this.FW_Order)));
			
			this.bEndWork = true;
			
			return;
		}
			
		console.log("Start updating MCU Firmware [" + (FW_Option[0] & (0x01 << this.FW_Order)) + "]");

		logOutput("Start updating MCU Firmware [" + (FW_Option[0] & (0x01 << this.FW_Order)) + "]");
		
		if (this.m_DeviceIspMode === 0)
		{
			this.ISPModeAP2ISP(false);
		}
		else
		{
			this.ISPModeAP2ISP(true);
		}
		
	};
	
	
	ISPModeAP2ISP(ApMode) {
		logOutput("ISPMode - AP to ISP");
		
		var bytes = new Uint8Array(255);

		for (var i = 0; i < 255; i++) {
			bytes[i] = 0;
		}

		bytes[0] = 3;
		bytes[1] = 0xfe;
		bytes[2] = 0xff;
		bytes[3] = USBUID_ISP_MCU_CMD.USBUID_ISP_MCU_CMD_SET_ISP_MODE;

		bytes[254] = 0x5a;	
		
		
		if (ApMode)
		{
			bytes[3] = USBUID_ISP_MCU_CMD.USBUID_ISP_MCU_CMD_SET_AP_MODE;

			//=> 要注意資料對齊問題, byte[3]~byte[6]剛好32bits, bytes[3]只給1個byte, 後面的fW check sum是WORD(2bytes), 所以會shift 1個bytes, bytes[5]開始塞check sum, bytes[4]是dummy byte 沒有使用
			//=>boot code & ap code用union, 要注意對齊問題

			//little endian
			var MCU_AP_BIN_checksum = new Uint16Array(1);//MainPage.Current.my_Isp_CheckFile.FW_CheckSum[(byte)ISP_BIN_FILE_SEQUENCE.BIN_MCU];
			MCU_AP_BIN_checksum[0] = FW_CheckSum_List[this.FW_Order];
			bytes[5] = (MCU_AP_BIN_checksum[0] & 0xFF);
			bytes[6] = (MCU_AP_BIN_checksum[0] >> 8) & 0xFF;


			//little endian
			var MCU_AP_BIN_Size = new Uint32Array(1);//MainPage.Current.my_Isp_CheckFile.FW_Size[(byte)ISP_BIN_FILE_SEQUENCE.BIN_MCU];
			MCU_AP_BIN_Size[0] = FW_Size_List[this.FW_Order];
			bytes[7] = (MCU_AP_BIN_Size[0] & 0xFF);
			bytes[8] = (MCU_AP_BIN_Size[0] >> 8) & 0xFF;
			bytes[9] = (MCU_AP_BIN_Size[0] >> 16) & 0xFF;
			bytes[10] = (MCU_AP_BIN_Size[0] >> 24) & 0xFF;


			bytes[11] = FW_Ver_from_File[ISP_BIN_FILE_SEQUENCE.BIN_MCU].charCodeAt(0);
			bytes[12] = FW_Ver_from_File[ISP_BIN_FILE_SEQUENCE.BIN_MCU].charCodeAt(1);
			bytes[13] = FW_Ver_from_File[ISP_BIN_FILE_SEQUENCE.BIN_MCU].charCodeAt(2);
			bytes[14] = FW_Ver_from_File[ISP_BIN_FILE_SEQUENCE.BIN_MCU].charCodeAt(3);
		}
		else
		{
			bytes[3] = USBUID_ISP_MCU_CMD.USBUID_ISP_MCU_CMD_SET_ISP_MODE;
		}
			
		
		
		HID_device[0].sendReport(sentReportId, bytes).then( () => {
			//logOutput("***Sent Report***");
			//logOutput_bytes(bytes, true);		
		});
	};
	
	

	ISPModeErasePage() {
		logOutput("ISPMode - Erase Page");
		
		var bytes = new Uint8Array(255);

		for (var i = 0; i < 255; i++) {
			bytes[i] = 0;
		}

		bytes[0] = 4;
		bytes[1] = 0xfe;
		bytes[2] = 0xff;
		bytes[3] = USBUID_ISP_MCU_CMD.USBUID_ISP_MCU_CMD_ERASE_FLASH_PAGE;

		if (FW_Size_List[ISP_BIN_FILE_SEQUENCE.BIN_MCU] % 512 > 0)
			bytes[4] = (FW_Size_List[ISP_BIN_FILE_SEQUENCE.BIN_MCU] / 4096) + 1;
		else
			bytes[4] = FW_Size_List[ISP_BIN_FILE_SEQUENCE.BIN_MCU] / 4096;

		bytes[254] = 0x00;	
		
		HID_device[0].sendReport(sentReportId, bytes).then( () => {
			//logOutput("***Sent Report***");
			//logOutput_bytes(bytes, true);		
		});
	};
	
	
	
	FW_Program(bFirstTimeProgram) {
		var Total_FileSize = FW_Size_List[this.FW_Order];
		var FW_Start_Pos = FW_Index_List[this.FW_Order] + 38;
		
		if (bFirstTimeProgram)
		{
			logOutput("MCU AP Code Bin File : " + Total_FileSize + " BYTES");

			this.u16_CheckSum[0] = 0;
			this.u32_m_sequense[0] = 0;
			this.readfile_TotalCount = 0;
		}
		
		if (this.readfile_TotalCount < Total_FileSize)
		{	
			var bytes = new Uint8Array(255);

			for (var i = 0; i < 255; i++) {
				bytes[i] = 0;
			}
			
			var remindsize = Total_FileSize - this.readfile_TotalCount;
			
			var curr_read_count = 0;
			
			if (remindsize < 128)
			{
				curr_read_count = remindsize;
			}
			else
			{
				curr_read_count = 128;
			}
			
			this.u32_m_sequense[0]++;


			bytes[0] = 4;
			bytes[1] = curr_read_count;
			bytes[2] = 0x5a;
			
			bytes[3] = this.u32_m_sequense[0] & 0xFF;
			bytes[4] = (this.u32_m_sequense[0] >> 8) & 0xFF;
			bytes[5] = (this.u32_m_sequense[0] >> 16) & 0xFF;
			bytes[6] = (this.u32_m_sequense[0] >> 24) & 0xFF;

			// if (this.readfile_TotalCount <= 256)
			// {
				// logOutput("this.readfile_TotalCount: " + this.readfile_TotalCount);
			// }
			
			for (var i = 0; i < curr_read_count; i++)
			{
				// if (this.readfile_TotalCount <= 256 && i < 16)
				// {
					// logOutput("FW_Bin: " + FW_Bin_array[FW_Start_Pos + this.readfile_TotalCount + i]);
				// }
				
				bytes[7 + i] = FW_Bin_array[FW_Start_Pos + this.readfile_TotalCount + i];
				this.u16_CheckSum[0] += FW_Bin_array[FW_Start_Pos + this.readfile_TotalCount + i];
			}
			
			bytes[254] = 0x00;	
			
			// if (this.readfile_TotalCount <= 256)
			// {
				// logOutput_bytes(bytes, true);
			// }
			
			this.readfile_TotalCount += curr_read_count;
			
			HID_device[0].sendReport(sentReportId, bytes).then(() => {	
				//logOutput("***Sent Report***");
				//logOutput_bytes(bytes, true);
			});
		}
		else
		{
			this.bUpdateFW_Done = true;
		}
	};
	
	
	FlashCheckSum() {
		logOutput("MCU AP Code verify checksum!");
		
		var bytes = new Uint8Array(255);

		for (var i = 0; i < 255; i++) {
			bytes[i] = 0;
		}
		
		bytes[0] = 4;
		bytes[1] = 0xfe;
		bytes[2] = 0xff;
		bytes[3] = USBUID_ISP_MCU_CMD.USBUID_ISP_MCU_CMD_FLASH_CHECKSUM;

		//=> 要注意資料對齊問題, byte[3]~byte[6]剛好32bits, bytes[3]只給1個byte, 後面的fW size是DWORD(4bytes), 所以會shift 3個bytes, bytes[7]開始塞FW size
		//=>boot code & ap code用union, 要注意對齊問題
		var u32Total_File_Size = new Uint32Array(1);
		u32Total_File_Size[0] = FW_Size_List[this.FW_Order];//FW_Bin_array.length;
		
		bytes[7] = (u32Total_File_Size[0] >> 24);
		bytes[8] = (u32Total_File_Size[0] >> 16);
		bytes[9] = (u32Total_File_Size[0] >> 8);
		bytes[10] = (u32Total_File_Size[0] & 0x00ff);
		
		bytes[254] = 0x6a;	

		HID_device[0].sendReport(sentReportId, bytes).then(() => {
			// logOutput("***Sent Report***");
			// logOutput_bytes(bytes, true);
		});
	};
	
	
	
	
	
	ISPModeSendSpareArea(index) {	
		var bytes = new Uint8Array(255);

		for (var i = 0; i < 255; i++) {
			bytes[i] = 0;
		}
		
		bytes[0] = 3;
		bytes[1] = 0xfe;
		bytes[2] = 0xff;
		bytes[3] = USBUID_ISP_MCU_CMD.USBUID_ISP_MCU_CMD_SENT_SPARE_AREA;

		bytes[4] = index;

		//index = 3n
		var sbVer = FW_Ver_from_File[0 + 3*index];
		var sbDate = FW_Date_from_File[0 + 3*index];
		var start_pos = 0;
		var end_pos = 18;
		for (var i = start_pos; i <= end_pos; i++)
		{
			if (i - start_pos < 12)
			{
				bytes[6 + i] = sbVer.charCodeAt(i - start_pos);
			}
			else
			{
				bytes[6 + i] = sbDate.charCodeAt(i - start_pos - 12);
			}
		}
		//index = 3n+1
		sbVer = FW_Ver_from_File[1 + 3*index];
		sbDate = FW_Date_from_File[1 + 3*index];
		start_pos = 19;
		end_pos = 37;
		for (var i = start_pos; i <= end_pos; i++)
		{
			if (i - start_pos < 12)
			{
				bytes[6 + i] = sbVer.charCodeAt(i - start_pos);
			}
			else
			{
				bytes[6 + i] = sbDate.charCodeAt(i - start_pos - 12);
			}
		}
		//index = 3n+2
		sbVer = FW_Ver_from_File[2 + 3*index];
		sbDate = FW_Date_from_File[2 + 3*index];
		start_pos = 38;
		end_pos = 56;
		for (var i = start_pos; i <= end_pos; i++)
		{
			if (i - start_pos < 12)
			{
				bytes[6 + i] = sbVer.charCodeAt(i - start_pos);
			}
			else
			{
				bytes[6 + i] = sbDate.charCodeAt(i - start_pos - 12);
			}
		}

		bytes[255] = 0x5a;
		
		HID_device[0].sendReport(sentReportId, bytes).then(() => {
			// logOutput("***Sent Report***");
			// logOutput_bytes(bytes, true);
		});
	};
	
	
	EndWork() {
		if (!this.bPassFlag) {
			logOutput("MCU AP code update failed!");
		}

		logOutput("End Work!");

		this.bEndWork = true;
		this.bStartProcess = false; 
		this.bJumptoBoot = false;
	};
	
	
	AnalyzeUSBRxData(RxData)
	{
		if (this.bMCU_Control_InitOK)
		{
			if (!this.bStartProcess || this.bEndWork)
			{
				return;
			}
		}
			
		//this = this class
		//logOutput("this1: " + this.bEndWork);
		//RxData[0] === command
		switch (RxData[0]) {
			case USBUID_ISP_MCU_CMD.USBUID_ISP_MCU_CMD_DEVICE_STATUS:
			{				
				if ((RxData[4] & 0x01) === 1) //ISP Mode
				{
					this.m_DeviceIspMode = (RxData[4] & 0x01);

					if (this.bStartProcess && this.bJumptoBoot)
					{
						logOutput("ISP device found! Bootloader is Running");
						logOutput("isp mode ready!");
						
						//await this.ISPModeErasePage();
					}
					else
					{
						logOutput("ISP device found! Bootloader is Running");
						logOutput("Stop FW update process!!!");

						//this.ISPModeAP2ISP(true);
					}
				}
				else // AP mode
				{
					if (this.bStartProcess)
					{
						//during MCU AP code update, have to check mode if still at AP mode
						//this.ISPModeCheckMode();
						logOutput("ISP device found! Bootloader is Running");
						logOutput("isp mode ready2!");
					}
					else //!bStartProcess
					{
						logOutput("AP device found!");

						this.m_DeviceIspMode = (RxData[4] & 0x01);

						//MainPage.Current.myFWUpdate_VL822_Q7.StartUpdateProcess();

						this.m_VersionSpareCnt = 0;

						logOutput("Get Current FW Versions!");

						this.ISPModeGetSpareArea(this.m_VersionSpareCnt);
					}
				}
				
				
			}
			break;
			case USBUID_ISP_MCU_CMD.USBUID_ISP_MCU_CMD_GET_SPARE_AREA:
			{
				//Note: RxData[4] = index

				//Get 57bytes of spare area
				var sbVer = new Uint8Array(BASE_CODE_LENGTH);
				var sbDate = new Uint8Array(BASE_CODE_LENGTH);

				var start_pos = 0;
				var end_pos = 18;
				for (var i = start_pos; i <= end_pos; i++)
				{
					if (RxData[5 + i] === 0) { RxData[5 + i] = 0x20; }

					if (i - start_pos < 12)
					{
						sbVer[i - start_pos] = RxData[5 + i];
					}
					else
					{
						sbDate[i - start_pos - 12] = RxData[5 + i];
					}
				}

				var myStr1 = new TextDecoder("utf-8").decode(sbVer);
				var myStr2 = new TextDecoder("utf-8").decode(sbDate);
				FW_Ver_from_MCU.push(myStr1);
				FW_Date_from_MCU.push(myStr2);

				sbVer = new Uint8Array(BASE_CODE_LENGTH);
				sbDate = new Uint8Array(BASE_CODE_LENGTH);
				
				start_pos = 19;
				end_pos = 37;
				for (var i = start_pos; i <= end_pos; i++)
				{
					if (RxData[5 + i] == 0) { RxData[5 + i] = 0x20; }

					if (i - start_pos < 12)
					{
						sbVer[i - start_pos] = RxData[5 + i];
					}
					else
					{
						sbDate[i - start_pos - 12] = RxData[5 + i];
					}
				}

				myStr1 = new TextDecoder("utf-8").decode(sbVer);
				myStr2 = new TextDecoder("utf-8").decode(sbDate);
				FW_Ver_from_MCU.push(myStr1);
				FW_Date_from_MCU.push(myStr2);

				sbVer = new Uint8Array(BASE_CODE_LENGTH);
				sbDate = new Uint8Array(BASE_CODE_LENGTH);
				
				start_pos = 38;
				end_pos = 56;
				for (var i = start_pos; i <= end_pos; i++)
				{
					if (RxData[5 + i] == 0) { RxData[5 + i] = 0x20; }

					if ( i - start_pos < 12)
					{
						sbVer[i - start_pos] = RxData[5 + i];
					}
					else
					{
						sbDate[i - start_pos - 12] = RxData[5 + i];
					}
				}

				myStr1 = new TextDecoder("utf-8").decode(sbVer);
				myStr2 = new TextDecoder("utf-8").decode(sbDate);
				FW_Ver_from_MCU.push(myStr1);
				FW_Date_from_MCU.push(myStr2);

				this.m_VersionSpareCnt++;

				if (this.m_VersionSpareCnt < 6)
				{
					this.ISPModeGetSpareArea(this.m_VersionSpareCnt);
				}
				else
				{
					logOutput("Check Version!");

					this.ISPModeCheckVersion();
				}
			}
			break;
			case USBUID_ISP_MCU_CMD.USBUID_ISP_MCU_CMD_DEVICE_VERSION:
			{
				logOutput("Version Check OK! Need to Update FW!");

				this.m_VersionNeedUpdate = true;

				this.bMCU_Control_InitOK = true;

				if (this.m_VersionNeedUpdate)
				{
					this.bMCU_Control_InitOK = true;

					//Update_FW_Status();
					//print FW_Ver_from_MCU and FW_Date_from_MCU
					// for (var i = 0; i < 9; i++)
					// {

						// logOutput(i + ", " + FW_Ver_from_MCU[i]);
					// }
					// logOutput("************************");
					// logOutput("************************");
					// for (var i = 0; i < 9; i++)
					// {

						// logOutput(i + ", " + FW_Date_from_MCU[i]);
					// }


				}

			}
			break;
			case USBUID_ISP_MCU_CMD.USBUID_ISP_MCU_CMD_SET_ISP_MODE:
			{
				this.bJumptoBoot = true;
				logOutput("Wait a moment please!");
				
				var iTimeCount = 12;
				while (iTimeCount > 0)
				{
					iTimeCount--;
					
					setTimeout(function() {
						if (iTimeCount % 3 == 0)
							logOutput("Waiting...");			
					}, 1000);			
				}
			}
			break;
			case USBUID_ISP_MCU_CMD.USBUID_ISP_MCU_CMD_ERASE_FLASH_PAGE:
			{
				// 1: flash erase error, 0: success
				if (RxData[4] === 1)
				{           
					logOutput("ISP Chip 3 ERASE ERROR!");
					this.EndWork();
				}
				else
				{
					logOutput("Start Programming MCU FW...");

					this.FW_Program(true);
				}
			}
			break;
			case USBUID_ISP_MCU_CMD.USBUID_ISP_MCU_CMD_WRITE_RESPONSE:
			{
				this.FW_Program(false);

				if (this.bUpdateFW_Done)
				{
					logOutput("MCU FW update completed!");
					logOutput("Check Sum of Reading File: " + this.u16_CheckSum[0]);
					this.FlashCheckSum();
				}
			}
			break;
			case USBUID_ISP_MCU_CMD.USBUID_ISP_MCU_CMD_FLASH_CHECKSUM:
			{
				var GetCheckSum = new Uint16Array(1);
				GetCheckSum[0] = 0;
				GetCheckSum[0] += RxData[6];
				GetCheckSum[0] += (RxData[7] << 8);

				logOutput("Get Check Sum of MCU AP code: " + GetCheckSum[0]);

				//Verify Check Sum
				if (this.u16_CheckSum[0] != GetCheckSum[0])
				{
					logOutput("Failed to Update FW!");
					this.bPassFlag = false;
				}
				else
				{
					this.bPassFlag = true;
				}

				//this.EndWork();   
				//this.ISPModeAP2ISP(true);
				this.m_VersionSpareCnt = 0;
				this.ISPModeSendSpareArea(this.m_VersionSpareCnt);
			}
			break;
			case USBUID_ISP_MCU_CMD.USBUID_ISP_MCU_CMD_SENT_SPARE_AREA:
			{
				this.m_VersionSpareCnt++;

				if (this.m_VersionSpareCnt < 6)
				{
					this.ISPModeSendSpareArea(this.m_VersionSpareCnt);
				}
				else
				{
					logOutput("Finish to Write Version data into MCU!");

					this.ISPModeAP2ISP(true);
		
					this.EndWork();
				}
			}
			break;
			
			
			
			// default:
		}
	};
	
}
