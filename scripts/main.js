const playButton = document.getElementById('startGameBtn');
const startGameContainer = document.getElementById('startGame');
playButton.addEventListener('click', () => {
    startGameContainer.style.display = 'none';
    insideGameContainer.style.display = 'flex';
    alertTimer();
    //Set Score to  0 
    score = 0;
    updateScore(0);
    isGameStarted = true;
    isGameEnd = false;

    //Using set time out to start the rendering balls after the alert timer function completes
    setTimeout(() => {
        animate();
        startRenderingBallsInterval();
        startGameTimer();
    }, 4000)
})
