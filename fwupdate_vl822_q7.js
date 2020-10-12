/*
FWUpdate_VL822_Q7 class included:
	a. StartUpdate()
	b. Initialize()
	c. Eraseflash()
	d. ReadStatus()
	e. FW_Program(bFirstTimeProgram)
	f. FlashCheckSum()
	g. EndWork()
	h. AnalyzeUSBRxData(RxData)
*/

class FWUpdate_VL822_Q7
{
	constructor() {	
		this. bStartProcess = false;
		
		this.readfile_TotalCount = 0;
		this.bPassFlag = true;
		
		//this.bEndWork = new Boolean(1);
		this.bEndWork = false;
		this.bUpdateFW_Done = false;
		
		this.u16_CheckSum = new Uint16Array(1);
		this.u16_CheckSum[0] = 0;
		
		this.u32_m_sequense = new Uint32Array(1);
		this.u32_m_sequense[0] = 0;
		
		this.FW_Order = ISP_BIN_FILE_SEQUENCE.BIN_VL822_Q7;
	}


	StartUpdate() {
		
		this. bStartProcess = true;
		
		if ( (FW_Option[0] & (0x01 << this.FW_Order)) === 0 )
		{
			logOutput("Skip updating Q7 Firmware..." +　(FW_Option[0] & this.FW_Order));
			
			this.bEndWork = true;
			
			return;
		}
			
		console.log("Start updating Q7 Firmware [" + (FW_Option[0] & (0x01 << this.FW_Order)) + "]");

		logOutput("Start updating Q7 Firmware [" + (FW_Option[0] & (0x01 << this.FW_Order)) + "]");
		
		this.Initialize();
		
		// setInterval(async () => {
			// await fetch("https://www.google.com/") 
		// }, 500);
		
		// while (!this.bEndWork)
		// {
			// setTimeout(function() {
				//your code to be executed after time up
				// logOutput("Waitting...");
			// }, 500);
		// }
		
	};


	Initialize() {
		logOutput("HUB VL822_Q7 Initial!");
		
		var bytes = new Uint8Array(255);

		for (var i = 0; i < 255; i++) {
			bytes[i] = 0;
		}

		bytes[0] = 4;
		bytes[1] = 0xfe;
		bytes[2] = 0xff;
		bytes[3] = UPDATE_CMD_Q7.USBUID_ISP_DEVICE_CMD_VL822_Q7_INITIAL;

		var slot_index = new Uint16Array(1);
		slot_index[0] = 0x01 << this.FW_Order;
		
		bytes[4] = (slot_index[0] >> 8) & 0xFF;         // Is the update successful? [high byte]
		bytes[5] = slot_index[0] & 0xFF;					// Is the update successful? [low byte]

		bytes[254] = 0x6a;	
		
		HID_device[0].sendReport(sentReportId, bytes).then( () => {
			//logOutput("***Sent Report***");
			//logOutput_bytes(bytes, true);		
		});
	};


	Eraseflash() {
		logOutput("HUB VL822_Q7 Erase flash!");
		
		var bytes = new Uint8Array(255);

		for (var i = 0; i < 255; i++) {
			bytes[i] = 0;
		}

		bytes[0] = 4;
		bytes[1] = 0xfe;
		bytes[2] = 0xff;
		bytes[3] = UPDATE_CMD_Q7.USBUID_ISP_DEVICE_CMD_VL822_Q7_ERASE_FLASH;

		bytes[254] = 0x6a;	

		HID_device[0].sendReport(sentReportId, bytes).then(() => {
			//logOutput("***Sent Report***");
			//logOutput_bytes(bytes, true);
		});
	};


	ReadStatus() {
		//logOutput("HUB VL822_Q7 Erase flash ReadStatus!");
		
		var bytes = new Uint8Array(255);

		for (var i = 0; i < 255; i++) {
			bytes[i] = 0;
		}

		bytes[0] = 4;
		bytes[1] = 0xfe;
		bytes[2] = 0xff;
		bytes[3] = UPDATE_CMD_Q7.USBUID_ISP_DEVICE_CMD_VL822_Q7_READ_STATUS;

		bytes[254] = 0x6a;	

		HID_device[0].sendReport(sentReportId, bytes).then(() => {
			//logOutput("***Sent Report***");
			//logOutput_bytes(bytes, true);
		});
	};


	FW_Program(bFirstTimeProgram) {
		
		//var Total_FileSize = FW_Bin_array.length;
		var Total_FileSize = FW_Size_List[this.FW_Order];
		var FW_Start_Pos = FW_Index_List[this.FW_Order] + 38;
		
		if (bFirstTimeProgram)
		{
			logOutput("HUB VL822_Q7 File : " + Total_FileSize + " BYTES");

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
			bytes[2] = UPDATE_CMD_Q7.USBUID_ISP_DEVICE_CMD_VL822_Q7_WRITE_RESPONSE;
			
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
			
			bytes[254] = 0x6a;	
			
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
		logOutput("HUB VL822_Q7 verify checksum!");
		
		var bytes = new Uint8Array(255);

		for (var i = 0; i < 255; i++) {
			bytes[i] = 0;
		}
		
		bytes[0] = 4;
		bytes[1] = 0xfe;
		bytes[2] = 0xff;
		bytes[3] = UPDATE_CMD_Q7.USBUID_ISP_DEVICE_CMD_VL822_Q7_CHECKSUM;

		var u32Total_File_Size = new Uint32Array(1);
		u32Total_File_Size[0] = FW_Size_List[this.FW_Order];//FW_Bin_array.length;
		
		bytes[4] = (u32Total_File_Size[0] >> 24);
		bytes[5] = (u32Total_File_Size[0] >> 16);
		bytes[6] = (u32Total_File_Size[0] >> 8);
		bytes[7] = (u32Total_File_Size[0] & 0x00ff);
		
		bytes[254] = 0x6a;	

		HID_device[0].sendReport(sentReportId, bytes).then(() => {
			// logOutput("***Sent Report***");
			// logOutput_bytes(bytes, true);
		});
	};


	EndWork() {
		logOutput("End Work!");
		
		var bytes = new Uint8Array(255);

		for (var i = 0; i < 255; i++) {
			bytes[i] = 0;
		}
		
		bytes[0] = 4;
		bytes[1] = 0xfe;
		bytes[2] = 0xff;
		bytes[3] = UPDATE_CMD_Q7.USBUID_ISP_DEVICE_CMD_VL822_Q7_END;
		bytes[4] = 0x00;

		var slot_index = new Uint16Array(1);
		slot_index[0] = 0x01 << this.FW_Order;
		
		bytes[5] = (slot_index[0] >> 8) & 0xFF;
		bytes[6] = slot_index[0] & 0xFF;
		
		if (this.bPassFlag)
		{
			bytes[7] = (slot_index[0] >> 8) & 0xFF;
			bytes[8] = slot_index[0] & 0xFF;
		}
		else
		{
			bytes[7] = 0x00;
			bytes[8] = 0x00;
		}

		//version	
		for (var i = 0; i < 19; i++)
		{
			if (i < 12)
			{
				bytes[9 + i] = FW_Ver_from_File[this.FW_Order].charCodeAt(i);
			}
			else
			{
				bytes[9 + i] = FW_Date_from_File[this.FW_Order].charCodeAt(i - 12);
			}
			
			//logOutput(byteToHex(bytes[9 + i]));
		}
		
		
		
		bytes[254] = 0x6a;	
		
		HID_device[0].sendReport(sentReportId, bytes).then(() => {
			// logOutput("***Sent Report***");
			// logOutput_bytes(bytes, true);
		});
	};


	AnalyzeUSBRxData(RxData)
	{
		if (!this.bStartProcess || this.bEndWork)
		{
			return;
		}
		
		//this = this class
		//logOutput("this1: " + this.bEndWork);
		//RxData[0] === command
		switch (RxData[0]) {
			case UPDATE_CMD_Q7.USBUID_ISP_DEVICE_CMD_VL822_Q7_INITIAL:
			{
				if (RxData[4] === 0x00)
				{
					logOutput("HUB VL822_Q7 Initial Successfully!");
					this.Eraseflash();
				}
				else
				{
					logOutput("Failed to HUB VL822_Q7 Initial!");
				}
			}
			break;
			case UPDATE_CMD_Q7.USBUID_ISP_DEVICE_CMD_VL822_Q7_ERASE_FLASH:
			{
				if (RxData[4] === 0x00)
				{
					this.ReadStatus();
				}
				else //if (RxData[5] > 0x00)
				{
					logOutput("Failed to HUB VL822_Q7 Erase flash!");
				}
			}
			break;
			case UPDATE_CMD_Q7.USBUID_ISP_DEVICE_CMD_VL822_Q7_READ_STATUS:
			{
				if (RxData[4] === 0x00)
				{
					logOutput("HUB VL822_Q7 Erase flash Successfully!");
					logOutput("HUB VL822_Q7 program flash!!");
					logOutput("HUB VL822_Q7 FW updating!");

					this.FW_Program(true);
				}
				else
				{
					logOutput("HUB VL822_Q7 Erase flash is On-going!");
					//setTimeout(this.ReadStatus(), 500);
					//this.ReadStatus();
					
					var that = this; //一定要這樣寫, 不然this會指到main window
					setTimeout(function() {
						that.ReadStatus();
					}, 500);
				}                         
			}
			break;
			case UPDATE_CMD_Q7.USBUID_ISP_DEVICE_CMD_VL822_Q7_WRITE_RESPONSE:
			{
				this.FW_Program(false);

				if (this.bUpdateFW_Done)
				{
					logOutput("HUB VL822_Q7 FW update completed!");
					logOutput("Check Sum of Reading File: " + this.u16_CheckSum[0]);

					this.FlashCheckSum();
				}
			}
			break;
			case UPDATE_CMD_Q7.USBUID_ISP_DEVICE_CMD_VL822_Q7_CHECKSUM:
			{
				// logOutput_bytes(RxData, false);
				
				var GetCheckSum = new Uint16Array(1);
				GetCheckSum[0] = 0;
				GetCheckSum[0] += RxData[5];
				GetCheckSum[0] += (RxData[6] << 8);

				logOutput("Get Check Sum of Q7: " + GetCheckSum);

				//Verify Check Sum
				if (this.u16_CheckSum[0] !== GetCheckSum[0])
				{
					logOutput("Failed to Update FW!");
					this.bPassFlag = false;
				}
				else
				{
					this.bPassFlag = true;
				}
				
				this.EndWork();
			}
			break;
			case UPDATE_CMD_Q7.USBUID_ISP_DEVICE_CMD_VL822_Q7_END:
			{
				// logOutput_bytes(RxData, false);
				
				this.bEndWork = true;
				logOutput("Finish HUB VL822_Q7 FW update!");
				
				//bStartProcess = false;
			}
			break;
			// default:
		}
	};
	
}



