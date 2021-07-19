//importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.1.5/workbox-sw.js');
importScripts('/workbox-v6.1.5/workbox-sw.js');

const precacheResources = [
	{url: '/workbox-v6.1.5/workbox-sw.js', revision: 'v6.1.5'},
	{url: '/workbox-v6.1.5/workbox-sw.js.map', revision: 'v6.1.5'},
	{url: '/workbox-v6.1.5/workbox-precaching.prod.js', revision: 'v6.1.5'},
	{url: '/workbox-v6.1.5/workbox-precaching.prod.js.map', revision: 'v6.1.5'},
	{url: '/workbox-v6.1.5/workbox-core.prod.js', revision: 'v6.1.5'},
	{url: '/workbox-v6.1.5/workbox-core.prod.js.map', revision: 'v6.1.5'},
	{url: '/workbox-v6.1.5/workbox-strategies.prod.js', revision: 'v6.1.5'},
	{url: '/workbox-v6.1.5/workbox-strategies.prod.js.map', revision: 'v6.1.5'},
	{url: '/workbox-v6.1.5/workbox-routing.prod.js', revision: 'v6.1.5'},
	{url: '/workbox-v6.1.5/workbox-routing.prod.js.map', revision: 'v6.1.5'},
	
	{url: '/icons/android-icon-36x36.png', revision: '0100'},
	{url: '/icons/android-icon-48x48.png', revision: '0100'},
	{url: '/icons/android-icon-72x72.png', revision: '0100'},
	{url: '/icons/android-icon-96x96.png', revision: '0100'},
	{url: '/icons/android-icon-144x144.png', revision: '0100'},
	{url: '/icons/android-icon-192x192.png', revision: '0100'},
	
	{url: '/icons/HP_Logo_60x60.png', revision: '0100'},
	{url: '/icons/HP_Logo_192x192.png', revision: '0100'},
	
	{url: '/icons/favicon.ico', revision: '0100'},


	{url: '/index.html', revision: '210715_0100'},
	{url: '/style.css', revision: '210715_0100'},
	{url: '/manifest.json', revision: '210715_0100'},
	{url: '/main.js', revision: '210715_0100'},
	
];	


//workbox.precaching.precacheAndRoute(precacheResources);
workbox.precaching.precache(precacheResources);

workbox.routing.registerRoute(
  /\.(?:js|css|png|ico|json|js.map)$/,
  new workbox.strategies.NetworkFirst()
  //new workbox.strategies.StaleWhileRevalidate()
);

workbox.routing.registerRoute(
  /(\/|\.html)$/,
  new workbox.strategies.NetworkFirst()
);


// Catch routing errors, like if the user is offline
workbox.routing.setCatchHandler(async ({ event }) => {
  // Return the precached offline page if a document is being requested
  if (event.request.destination === 'document') {
    //return workbox.precaching.matchPrecache('/offline.html');
	return workbox.precaching.matchPrecache('/index.html');
  }
  if (event.request.destination === 'image') {
    return workbox.precaching.matchPrecache('/icons/favicon.ico');
  }

  return Response.error();
});
