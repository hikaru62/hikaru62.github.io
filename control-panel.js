(function() {
  var ui = {
    disconnect: null,
    getDock: null,
	selectFW: null,
    update: null,
    clear: null,
	outputLog: null,
	fwPath: null,
  };

  var HID_device;
  var connection = -1;
  var sentReportId = 2;
  var readReportId = 1;
  var FW_Path = "";

  var initializeWindow = function() {
    for (var k in ui) {
      var id = k.replace(/([A-Z])/, '-$1').toLowerCase();
      var element = document.getElementById(id);
      if (!element) {
        throw "Missing UI element: " + k;
      }
      ui[k] = element;
    }
    enableIOControls(false);

    ui.disconnect.addEventListener('click', onDisconnectClicked);
    ui.getDock.addEventListener('click', onGetDockClicked);
	ui.selectFW.addEventListener('click', onSelectFWClicked);
    ui.update.addEventListener('click', onUpdateClicked);

    ui.clear.addEventListener('click', onClearClicked);
    //enumerateDevices();
	
	
	
	
	//navigator.usb.addEventListener('connect', event => {
	  // Add |event.device| to the UI.
	  
	  //console.log('HID connected: ${HID_device.productName}');
	  
	//});
	
	//navigator.usb.addEventListener('disconnect', event => {
	  // Remove |event.device| from the UI.
	//});
	
	

	//Plug & Unplug Dock event
	navigator.hid.addEventListener("connect", handleHIDConnectedDevice);
    navigator.hid.addEventListener("disconnect", handleHIDDisconnectedDevice);
		
  };

  var enableIOControls = function(ioEnabled) {
	
	ui.disconnect.disabled = !ioEnabled;
	ui.selectFW.disabled = !ioEnabled;
    ui.update.disabled = !ioEnabled;
  };
		
  //Add Device
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
	  
	  console.log(HID_device[0].productName + " is selected");
	  logOutput(HID_device[0].productName + " is selected");
	  
	  ConnectHIDDevice();
	  	  
  };

  //Plug Dock
  function handleHIDConnectedDevice(e) {
	console.log("Device connected: " + e.device.productName);
  }
  
  //Unplug Dock
  function handleHIDDisconnectedDevice(e) {
    console.log("Device disconnected: " + e.device.productName);
  }


  function handleHIDInputReport(e) {
    //console.log(e.device.productName + ": got input report " + e.reportId);
    //console.log(new Uint8Array(e.data.buffer));
	
	logOutput("***Receive Report***");
	logOutput_bytes(new Uint8Array(e.data.buffer), false);
  }

  var enumerateDevices = function() {
	  
	  document.addEventListener('DOMContentLoaded', async () => {
      let devices = await navigator.hid.getDevices();
      devices.forEach(device => {
      // Add |device| to the UI.
	  console.log(device.productName);
        });
      });

  };
  
  

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
	/*
    if (connection === -1)
      return;
    chrome.hid.disconnect(connection, function() {
      connection = -1;
    });
    enableIOControls(false);
	*/
  };

  var onSelectFWClicked = async function() {

     logOutput("Click Select File button");
	 
	 FW_Path = await self.showOpenFilePicker({
       multiple: false,
       types: [{description: 'Binary files', accept: {'BIN/*': ['bin', 'txt']}}],
       //suggestedStartLocation: 'pictures-library'
	   permission: { readable:true}
     });
	 
	 if (!FW_Path)
	 {
		 logOutput("No Firmware file selected");
		 return;
	 }

     const file_reader = new FileReader();
     file_reader.onload = (event) => {
			 
			 logOutput(FW_Path);
			 logOutput(event.target.result);
			 
	 }
	 file_reader.readAsText(FW_Path)
		 
		 //navigator.files.requestPermission
		 //FW_Path.requestPermission({ writable: true })
		 logOutput(FW_Path);
		 
		 //FW_Path.requestPermission({ read: true })
		 //ui.fwPath.textContent = FW_Path.pathname.gets
	 
  };
  

  var onUpdateClicked = function() {
	var bytes = new Uint8Array(255);
	
	for (var i = 0; i < 255; i++) {
      bytes[i] = 0;
    }
	
	//bytes[0] = 2;
	bytes[0] = 3;
	bytes[1] = 0xfe;
	bytes[2] = 0xff;
	bytes[3] = 0xd2;
	bytes[254] = 0x6a;
	
	//logInput(bytes);
	
	
	
	ui.selectFW.disabled = true;
    ui.update.disabled = true;
	
	HID_device[0].sendReport(sentReportId, bytes).then(() => {
	  ui.selectFW.disabled = false;
	  ui.update.disabled = false;
      console.log("Sent Report");
	  logOutput("***Sent Report***");
	  logOutput_bytes(bytes, true);
	  
    });
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

  var onClearClicked = function() {
    ui.outputLog.textContent = "";
  };

  window.addEventListener('load', initializeWindow);
}());
