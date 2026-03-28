export const environment = {
  production: false,
  // We use window.location.hostname so it automatically works on BOTH PC and Mobile!
  apiUrl:     `http://${window.location.hostname}:8000`,
  wsUrl:      `ws://${window.location.hostname}:8000`,
};
