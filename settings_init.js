var sentReportId = 2;
var readReportId = 1;
var HID_device;

var fileReader = new FileReader();
var FW_Bin_array = null;

var myFWUpdate_VL822_Q7 = null;


////////////////
//ISP Check file
////////////////
var FW_LIST_NUM = 9;
var FW_NUMS_MAX = 18;
//start index of each code_ver in FW_Package.bin, the length should be FW num. + 1. 因為前後都有code_ver.txt
var FW_Index_List = new Uint32Array(FW_NUMS_MAX + 1);
var FW_Index_Num = 0;

var code_ver = new Uint8Array(38);
var code_ver_size = 38;

var FW_CheckSum = new Uint16Array(FW_NUMS_MAX + 1);
var FW_Size = new Uint32Array(FW_NUMS_MAX + 1);

var FW_Ver_from_File = [];
var FW_Date_from_File = [];
var FW_CheckSum_from_File = new Uint16Array(FW_NUMS_MAX);


var ISP_BIN_FILE_SEQUENCE = {
	'BIN_MCU':0,
	'BIN_VL822_Q7':1,
	'BIN_CX21985':2,
	'BIN_VL211_Q4':3,
	'BIN_FL7112_1Q0':4,
	'BIN_I225':5,
	'BIN_VL822_Q8':6,
	'BIN_TITAN_RIDGE':7,
	'BIN_VMM5322':8,
	'BIN_RTL8153B':9,
	'BIN_FW_VER_INFO':10,
};

var UPDATE_CMD_Q7 = {
	'USBUID_ISP_DEVICE_CMD_VL822_Q7_INITIAL': 100,
	'USBUID_ISP_DEVICE_CMD_VL822_Q7_ERASE_FLASH': 101,
	'USBUID_ISP_DEVICE_CMD_VL822_Q7_PROGRAM': 102,
	'USBUID_ISP_DEVICE_CMD_VL822_Q7_WRITE_RESPONSE': 103,
	'USBUID_ISP_DEVICE_CMD_VL822_Q7_READ_STATUS': 104,
	'USBUID_ISP_DEVICE_CMD_VL822_Q7_CHECKSUM': 105,
	'USBUID_ISP_DEVICE_CMD_VL822_Q7_END': 106,
};