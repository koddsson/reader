self.addEventListener('push', function(event) {
  const options = {
    body: 'New items in feed!'
  }
  event.waitUntil(self.registration.showNotification('Reader', options))
})
