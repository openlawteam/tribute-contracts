process.on("unhandledRejection", (err, r) => {
  console.log(r); // to show where it has failed
  throw err;
});
