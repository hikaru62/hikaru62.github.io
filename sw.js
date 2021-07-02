importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.1.5/workbox-sw.js');


// Catch routing errors, like if the user is offline
workbox.routing.setCatchHandler(async ({ event }) => {
  // Return the precached offline page if a document is being requested
  if (event.request.destination === 'document') {
    return matchPrecache('/offline.html');
  }

  return Response.error();
});
