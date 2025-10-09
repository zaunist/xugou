// 这个文件可以保留为空，或者删除。
// vite-plugin-pwa 会在构建时自动生成新的 sw.js 文件到输出目录（dist）。
// 开发环境中，为了避免旧的 Service Worker 缓存导致问题，我们最好确保它被正确地注销。
// 如果您在开发时遇到缓存问题，可以取消下面代码的注释来强制注销。

/*
self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    self.registration.unregister().then(() => {
      return self.clients.matchAll();
    }).then(clients => {
      clients.forEach(client => client.navigate(client.url));
    })
  );
});
*/
