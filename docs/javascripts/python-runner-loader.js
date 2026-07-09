(function () {
  const loaderUrl = document.currentScript && document.currentScript.src;
  const assetBaseUrl = new URL(".", loaderUrl || document.baseURI);
  let diagramRunnerPromise;
  let pythonRunnerPromise;

  function loadRunner(name, currentPromise, setPromise) {
    if (currentPromise) {
      return currentPromise;
    }

    const promise = import(new URL(name, assetBaseUrl).href).catch((error) => {
      setPromise(undefined);
      throw error;
    });
    setPromise(promise);
    return promise;
  }

  function initialize(root) {
    if (root.querySelector("[data-python-runner], [data-c-runner], [data-c-terminal-runner]")) {
      loadRunner("python-runner.js", pythonRunnerPromise, (promise) => {
        pythonRunnerPromise = promise;
      }).catch((error) => console.error("Python runner failed to load.", error));
    }

    if (root.querySelector("[data-python-diagram-runner]")) {
      loadRunner("python-diagram-runner.js", diagramRunnerPromise, (promise) => {
        diagramRunnerPromise = promise;
      }).catch((error) => console.error("Python diagram runner failed to load.", error));
    }
  }

  document.addEventListener("DOMContentLoaded", () => initialize(document));

  if (window.document$ && typeof window.document$.subscribe === "function") {
    window.document$.subscribe(() => initialize(document));
  }

  initialize(document);
}());
