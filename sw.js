importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.1.5/workbox-sw.js');
//importScripts('/workbox-v6.1.5/workbox-sw.js');

const precacheResources = [
	/*{url: '/index.html', revision: '20210703'},*/
	{url: '/offline.html', revision: '20210702'},
	/*{url: '/workbox-v6.1.5/workbox-sw.js', revision: 'v6.1.5'},*/
	{url: '/icons/HP_Logo_60x60.png', revision: '001'},
	{url: '/icons/favicon-96x96.png', revision: '001'},
	{url: '/icons/favicon-32x32.png', revision: '001'},
	{url: '/icons/favicon-16x16.png', revision: '001'},
	{url: '/style.css', revision: '001'},
	{url: '/manifest.json', revision: '001'},
	{url: '/main.js', revision: '001'},	
	{url: '/settings_init.js', revision: '001'},
	{url: '/ui_init.js', revision: '001'},
	{url: '/upload_bin_file.js', revision: '001'},
	{url: '/dock_ctrl.js', revision: '001'},
];


//workbox.precaching.precacheAndRoute(precacheResources);


// Catch routing errors, like if the user is offline
workbox.routing.setCatchHandler(async ({ event }) => {
  // Return the precached offline page if a document is being requested
  if (event.request.destination === 'document') {
    return matchPrecache('/offline.html');
  }

  return Response.error();
});
