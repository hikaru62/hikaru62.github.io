var ui = {
	disconnect: null,
	getDock: null,
	selectFW: null,
	update: null,
	clear: null,
	outputLog: null,
};


var initializeWindow = function() {
	//get ui elements
	for (var k in ui) {
	  var id = k.replace(/([A-Z])/, '-$1').toLowerCase();
	  var element = document.getElementById(id);
	  if (!element) {
		throw "Missing UI element: " + k;
	  }
	  ui[k] = element;
	}
	
	enableIOControls(false);

	ui.getDock.addEventListener('click', onGetDockClicked);
	ui.disconnect.addEventListener('click', onDisconnectClicked);
	ui.selectFW.addEventListener('change', onSelectFWClicked);
	ui.update.addEventListener('click', onUpdateClicked);
	ui.clear.addEventListener('click', onClearClicked);

	//Plug & Unplug Dock event
	navigator.hid.addEventListener("connect", handleHIDConnectedDevice);
	navigator.hid.addEventListener("disconnect", handleHIDDisconnectedDevice);

	fileReader.addEventListener("load", ISP_CheckFile);	
};


function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

//Get Dock
var onGetDockClicked = async function() {
	try 
	{
		HID_device = await navigator.hid.requestDevice({ filters: [{	
			vendorId: 0x0416,
			productId: 0x5020,
		}]});
	} 
	catch (err) 
	{
		// No device was selected.
		console.log("No device was selected");
		logOutput("No Dock was detected");
	}

	if (HID_device.length == 0) {
		// Add |device| to the UI.
		console.log("No device was selected");
		logOutput("No Dock was selected...");
		return;
	}

	logOutput(HID_device[0].productName + " is selected");

	ConnectHIDDevice();
};


////////////////////
//Select file
////////////////////
var onSelectFWClicked = function() {

	if (this.files.length > 0) {
		fileReader.readAsArrayBuffer(this.files[0])
	}
	else {
		logOutput("No Firmware file selected");
	}
};

var ISP_CheckFile = function(event) {
	
	FW_Index_List = new Uint32Array(FW_NUMS_MAX + 1);
	FW_Index_Num = 0;

	code_ver = new Uint8Array(38);
	code_ver_size = 38;

	FW_CheckSum_List = new Uint16Array(FW_NUMS_MAX);
	FW_Size_List = new Uint32Array(FW_NUMS_MAX);

	FW_Ver_from_File = [];
	FW_Date_from_File = [];
	FW_CheckSum_from_File = new Uint16Array(FW_NUMS_MAX);
	
	
	
	var data = event.target.result;
	FW_Bin_array = new Uint8Array(data);

	var Checksum = new Uint16Array(1);

	FW_Bin_array.forEach(value => Checksum[0] += value);

	logOutput("File size(bytes): " + FW_Bin_array.length + " , CheckSum: " + Checksum[0]);
	
	
	var Result = CheckBinFile();
	
	//logOutput("CheckBinFile: " + Result);
	
	if (Result)
	{
		Result = CheckFileFWVer();
		
		//logOutput("CheckFileFWVer: " + Result);
	}
	
	
	ISP_CheckFileResult = Result;

	if (Result)
	{
		myDock_Init = new Dock_Init(false);
		myDock_Init.ISPModeCheckMode();
	}
	
};

//Get Start Index of each code_ver and calculate the check sum and bin file size (bytes)
var CheckBinFile = function() {
	
	for (var i = 0; i < 38; i++)
	{
		code_ver[i] = FW_Bin_array[i];
		//logOutput(code_ver[i]);
	}
	
	//Get FW_Option
	var FW_Option_HexString = new Uint8Array(4);
	FW_Option_HexString[0] = code_ver[33];
	FW_Option_HexString[1] = code_ver[34];
	FW_Option_HexString[2] = code_ver[35];
	FW_Option_HexString[3] = code_ver[36];
	myFW_Option_Str = new TextDecoder("utf-8").decode(FW_Option_HexString);
	var FW_Option_dec = parseInt('0x' + myFW_Option_Str,16);		
	if (isNaN(FW_Option_dec))
		FW_Option_dec = 0;
	FW_Option[0] = FW_Option_dec;
	//logOutput("FW_Option: " + FW_Option[0]);
	
	
	//Get Start Index
	//check each byte to get start index of each code_ver
	for (var i = 0; i < FW_Bin_array.length; i++)
	{	
		var currStartIndex = -1;

		//"5"
		if (FW_Bin_array[i] === code_ver[0])
		{
			currStartIndex = i;

			//"A", "U", "S", "I"
			if (FW_Bin_array[i + 1] === code_ver[1] &&
				FW_Bin_array[i + 19] === code_ver[19] &&
				FW_Bin_array[i + 20] === code_ver[20] &&
				FW_Bin_array[i + 21] === code_ver[21])
			{
				//logOutput("currStartIndex: " + currStartIndex);
				FW_Index_List[FW_Index_Num] = currStartIndex;
				
				FW_Index_Num++;	
			}

		}
	}
	
	//logOutput("FW_Index_Num: " + FW_Index_Num);
	//FW_Index_List.forEach(value => logOutput(value));
	
	if (FW_Index_Num < FW_LIST_NUM)
	{
		logOutput("Firmware File is Wrong!");
		return false;
	}
	
	
	//Get Check sum and file szie from each BIN file.
	var currCheckSum = new Uint16Array(1);
	var currFileSize = new Uint32Array(1);
	
	currCheckSum[0] = 0;
	currFileSize[0] = 0;
	
	for (var i = 0; i < FW_Index_Num - 1; i++)
	{
		currFileSize[0] = FW_Index_List[i + 1] - FW_Index_List[i] - code_ver_size;
		
		//get each bin file from FW_Bin_array
		for (var k = FW_Index_List[i] + code_ver_size; k < FW_Index_List[i+1];k++)
		{
			currCheckSum[0] += FW_Bin_array[k];
		}
		
		FW_CheckSum_List[i] = currCheckSum[0];
		FW_Size_List[i] = currFileSize[0];	
		
		currCheckSum[0] = 0;
	}
	
	// for (var i = 0; i < FW_Index_Num - 1; i++)
	// {
		// logOutput(i + ", CheckSum: " + FW_CheckSum[i] + ", File Size: " + FW_Size[i])
	// }
	
	return true;
};

//Get FW ver, date and check sum from FW_file.txt in FW_Package.bin and compare the check sum with check sum got from CheckBinFile()
var CheckFileFWVer = function() {
	
	//Get FW_file.txt from FW_Package.bin
	var FW_Ver_Info = new Uint8Array(FW_Size_List[ISP_BIN_FILE_SEQUENCE.BIN_FW_VER_INFO]);
	// logOutput("FW_Ver_Info: " + FW_Ver_Info.length);
	
	for (var i = 0; i < FW_Ver_Info.length; i++)
	{
		FW_Ver_Info[i] = FW_Bin_array[FW_Index_List[ISP_BIN_FILE_SEQUENCE.BIN_FW_VER_INFO] + code_ver_size + i];
	}
	
	//var string = new TextDecoder("utf-8").decode(FW_Ver_Info);
	//logOutput(string);
	
	// var BASE_CODE_LENGTH = 12;
	// var CONFIG_CODE_LENGTH = 7;
	// var CHECKSUM_CODE_LENGTH = 4;
	
	//length = 23 for each FW data
	var byteFW_Data = new Uint8Array(BASE_CODE_LENGTH + CONFIG_CODE_LENGTH + CHECKSUM_CODE_LENGTH);
	
	var iFW_Count = 0;
	
	for (var i = 0; i < FW_Ver_Info.length; i++)
	{
		byteFW_Data[i % 23] = FW_Ver_Info[i];
		
		if (i%23 === 22)
		{
			iFW_Count++;
			
			var FW_Ver = new Uint8Array(BASE_CODE_LENGTH);
			var FW_Date = new Uint8Array(CONFIG_CODE_LENGTH);
			var FW_CheckSum = new Uint8Array(CHECKSUM_CODE_LENGTH);
			
			for (var a = 0; a < byteFW_Data.length; a++)
			{
				if (a < 12)
					FW_Ver[a] = byteFW_Data[a];
				else if (a < 19)
					FW_Date[a -12] = byteFW_Data[a];
				else//a < 23
				{
					FW_CheckSum[a - 19] = byteFW_Data[a];
				}
			}
			
			
			var myStr = new TextDecoder("utf-8").decode(FW_Ver);
			FW_Ver_from_File.push(myStr);
			
			myStr = new TextDecoder("utf-8").decode(FW_Date);
			FW_Date_from_File.push(myStr);
			
			myStr = new TextDecoder("utf-8").decode(FW_CheckSum);
			//logOutput("FW_CheckSum: " + myStr);
			var dec = parseInt('0x' + myStr,16);		
			if (isNaN(dec))
				dec = 0;
			//logOutput("dec: " + dec);
			FW_CheckSum_from_File[iFW_Count - 1] = dec;			
		}
		
	}
	
	if (iFW_Count !== FW_NUMS_MAX)
	{
		logOutput("Firmware File is Wrong!");
		return false;
	}
	
	//debug
	// for (var i = 0; i < FW_CheckSum_from_File.length; i++)
	// {
		// logOutput(i + ", FW_Ver[" + FW_Ver_from_File[i] + "] FW_Date[" + FW_Date_from_File[i] + "] Check Sum[" + FW_CheckSum_from_File[i] + "]");
	// }

	//verify check sum
	var iCount = 0;
	for (var i = 0; i < FW_LIST_NUM; i++)
	{
		if (FW_CheckSum_List[i] !== FW_CheckSum_from_File[i])
		{
			logOutput("FW Order " + iCount + " is Wrong..." + FW_CheckSum_List[i] + "..." + FW_CheckSum_from_File[i]);
			
			return false;
		}
		
		//logOutput(i + ", BIN FW[" + FW_CheckSum_List[i] + "] FILE_DATA[" + FW_CheckSum_from_File[i] + "]");
		
		iCount++;
	}
	
	logOutput("Firmware Package Check is PASSED");

	return true;
};

		


var onUpdateClicked = async function() {
	
	ClickedUpdateButton = true;
	// if (!ISP_CheckFileResult)
	// {
		// logOutput("Firmware File is Wrong!");
		
		// return;
	// }
	
	myFWUpdate_VL822_Q7 = new FWUpdate_VL822_Q7();
	//myDock_Init = new Dock_Init(false);
	
	logOutput("Disable Panel");
	await enableIOControls(false);
	//ui.update.disabled = true;
	
	
	
	await myFWUpdate_VL822_Q7.StartUpdate();
	//await myDock_Init.StartUpdate();
	
	
	var myinterval = setInterval(async () => {

			if (!myFWUpdate_VL822_Q7.bEndWork)
			{
				//logOutput("Waiting...");
			}
			else if (!myDock_Init.bEndWork)
			{
				if (!myDock_Init.bStartProcess)
				{
					myDock_Init.StartUpdate();
				}
			}
			else
			{
				logOutput("Enable Panel");
				await enableIOControls(true);
				
				clearInterval(myinterval);
				
				ClickedUpdateButton = false;
			}
	}, 500);

	
};


//Plug Dock
function handleHIDConnectedDevice(e) {
	console.log("Device connected: " + e.device.productName);
}

//Unplug Dock
function handleHIDDisconnectedDevice(e) {
	console.log("Device disconnected: " + e.device.productName);
}

var ConnectHIDDevice = function() {
	HID_device[0].open().then(() => {
		console.log("Opened device: " + HID_device[0].productName);
		logOutput("Connected to " + HID_device[0].productName);
		
		HID_device[0].addEventListener("inputreport", handleHIDInputReport);

		enableIOControls(true);
	});
};

var onDisconnectClicked = function() {
	HID_device[0].close().then(() => {
		console.log("Closed device: " + HID_device[0].productName);
		logOutput("Disconnected " + HID_device[0].productName);

		enableIOControls(false);
	});

};

var onClearClicked = function() {
	ui.outputLog.textContent = "";
};

/////////////////////////////
/////////////////////////////
//USB Rx Data Receive
/////////////////////////////
/////////////////////////////
function handleHIDInputReport(e) {
	var RxData = new Uint8Array(e.data.buffer);

	//show Rxdata
	//logOutput("***Receive Report***");
	//logOutput_bytes(RxData, false);

	//myFWUpdate_VL822_Q7.AnalyzeUSBRxData(RxData);
	
	myDock_Init.AnalyzeUSBRxData(RxData);
	
	if (ClickedUpdateButton)
	{
		myFWUpdate_VL822_Q7.AnalyzeUSBRxData(RxData);
	}

}

/*
var enumerateDevices = function() {
	document.addEventListener('DOMContentLoaded', async () => {
	let devices = await navigator.hid.getDevices();
	devices.forEach(device => {
	// Add |device| to the UI.
	console.log(device.productName);
	});
	});
};
*/
  


 var enableIOControls = function(ioEnabled) {

	ui.disconnect.disabled = !ioEnabled;
	//ui.selectFW.disabled = !ioEnabled;
	//ui.update.disabled = !ioEnabled;
};

var byteToHex = function(value) {
	if (value < 16)
		return '0' + value.toString(16);
	
	return value.toString(16);
};

  
var logOutput = function(myText) {
	ui.outputLog.textContent += myText + "\n";
	ui.outputLog.scrollTop = ui.outputLog.scrollHeight;
};
  
var logOutput_bytes = function(bytes, bSent) {
	var log = byteToHex(sentReportId) + ' ';
	if (!bSent)
		log = byteToHex(readReportId) + ' ';

	for (var i = 0; i < bytes.length; i += 16) {
		var sliceLength = Math.min(bytes.length - i, 16);
		var lineBytes = new Uint8Array(bytes.buffer, i, sliceLength);
		
		for (var j = 0; j < lineBytes.length; ++j) {
			log += byteToHex(lineBytes[j]) + ' ';

			if ( j % 15 == 14)
			log += '\n'
		}
	}

	log += "===============================================\n";
	ui.outputLog.textContent += log;
	ui.outputLog.scrollTop = ui.outputLog.scrollHeight;
};

/*
var checkEndResult = async function(checkitem) {
	
	
	if (checkitem[0])
	{
		logOutput("Endddddddd");
		return;
	}
	
	setTimeout(async function() {
		//your code to be executed after time up
		logOutput("checking.......");
		await checkEndResult(checkitem[0]);
	}, 500);
}*/