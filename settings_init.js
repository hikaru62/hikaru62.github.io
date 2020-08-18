var sentReportId = 2;
var readReportId = 1;
var HID_device;

var fileReader = new FileReader();
var FW_Bin_array = null;

var myDock_Init = null;
var myFWUpdate_VL822_Q7 = null;


////////////////
//ISP Check file
////////////////
var BASE_CODE_LENGTH = 12;
var CONFIG_CODE_LENGTH = 7;
var CHECKSUM_CODE_LENGTH = 4;
	
var FW_LIST_NUM = 9;
var FW_NUMS_MAX = 18;
//start index of each code_ver in FW_Package.bin, the length should be FW num. + 1. 因為前後都有code_ver.txt
var FW_Index_List = new Uint32Array(FW_NUMS_MAX + 1);
var FW_Index_Num = 0;

var code_ver = new Uint8Array(38);
var code_ver_size = 38;

var FW_Option = new Uint16Array(1);

var FW_CheckSum_List = new Uint16Array(FW_NUMS_MAX);
var FW_Size_List = new Uint32Array(FW_NUMS_MAX);

var FW_Ver_from_File = [];
var FW_Date_from_File = [];
var FW_CheckSum_from_File = new Uint16Array(FW_NUMS_MAX);

var ISP_CheckFileResult = false;



//Dock init
var FW_Ver_from_MCU = [];
var FW_Date_from_MCU = [];


var ClickedUpdateButton = false;



var USBUID_ISP_MCU_CMD = {
	'USBUID_ISP_MCU_CMD_NONE':0,
	'USBUID_ISP_MCU_CMD_READ_SIGNAUTRE':1,
	'USBUID_ISP_MCU_CMD_SET_AP_MODE':2,
	'USBUID_ISP_MCU_CMD_SET_ISP_MODE':3,
	'USBUID_ISP_MCU_CMD_ERASE_FLASH_PAGE':4,
	'USBUID_ISP_MCU_CMD_FLASH_CHECKSUM':5,
	'USBUID_ISP_MCU_CMD_SET_ISP_EJ898C_ISP':6,
	'USBUID_ISP_MCU_CMD_DEVICE_STATUS':7,
	'USBUID_ISP_MCU_CMD_DEVICE_VERSION':8,
	'USBUID_ISP_MCU_CMD_SENT_SPARE_AREA':9,
	'USBUID_ISP_MCU_CMD_GET_SPARE_AREA':10,
	'USBUID_ISP_MCU_CMD_SWITCH_USB2':11,
	'USBUID_ISP_MCU_CMD_READ_BOOT_GPIO':12,
	'USBUID_ISP_MCU_CMD_WRITE_BOOT_GPIO':13,
	'USBUID_ISP_MCU_CMD_RESET_DEVICE':14,

	'USBUID_ISP_MCU_CMD_SEND_FW_INFO':20,
	'USBUID_ISP_MCU_CMD_UPDATE_MCU_FW_INFO':21,

	'USBUID_ISP_MCU_CMD_WRITE_RESPONSE':128,
};




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









