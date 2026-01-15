self.addEventListener("install", () => {
  self.skipWaiting();
});
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js");
}
