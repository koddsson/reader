self.addEventListener('push', function(event) {
  const options = {
    body: 'New items in feed!'
  }
  event.waitUntil(self.registration.showNotification('Reader', options))
})

self.onnotificationclick = function(event) {
  event.notification.close()

  // This looks to see if the current is already open and
  // focuses if it is
  event.waitUntil(
    clients.matchAll({type: 'window'}).then(function(clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i]
        if (client.url == '/' && 'focus' in client) {
          return client.focus()
        }
      }
      if (clients.openWindow) return clients.openWindow('/')
    })
  )
}
