export default function throttled(delay, fn) {
  let lastTime = 0;
  return function (...args) {
    const nowTime = new Date().getTime();
    if (nowTime - lastTime < delay) return;
    lastTime = nowTime;
    return fn(...args);
  };
}
