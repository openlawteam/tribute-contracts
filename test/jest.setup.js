const unhandledRejectionPromise = new Promise((resolve) => {
  process.on("unhandledRejection", resolve);
});