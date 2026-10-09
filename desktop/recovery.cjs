document.getElementById('retry').addEventListener('click', async () => {
  const button = document.getElementById('retry');
  button.disabled = true;
  try {await window.alvoradaRecovery.retry();} finally {button.disabled = false;}
});
