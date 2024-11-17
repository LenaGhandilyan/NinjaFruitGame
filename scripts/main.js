// const canvas = document.getElementById("canvas");
// const ctx = canvas.getContext("2d");

// //Set Canvas Size
// canvas.width = window.innerWidth;
// canvas.height = window.innerHeight;

// let lastX;
// let lastY;

// window.addEventListener("mousemove", (event) => {
//     const x = event.pageX;
//     const y = event.pageY;

//     // Clear the previous line segment
//     ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

//     if (lastX !== null && lastY !== null) {

//         const deltaX = x - lastX;
//         const deltaY = y - lastY;

//         // Extend the starting point of the line backward to make it longer
//         const extendedX = lastX - deltaX * 2;
//         const extendedY = lastY - deltaY * 2;

//         const lineThickness = 5; // Initial thickness of the line
//         const taperSteps = 5; // Number of steps for tapering
//         const taperFactor = 0.8;

//         for (let i = 0; i < taperSteps; i++) {
//             ctx.strokeStyle = `rgba(0, 0, 0, ${0.7 * (1 - i / taperSteps)})`; // Adjust opacity for fade
//             ctx.lineWidth = lineThickness * Math.pow(taperFactor, i); // Gradually decrease line thickness

//             ctx.beginPath();
//             ctx.moveTo(
//                 extendedX + (deltaX * i) / taperSteps, 
//                 extendedY + (deltaY * i) / taperSteps
//             );
//             ctx.lineTo(
//                 x + (deltaX * (i - taperSteps)) / taperSteps, 
//                 y + (deltaY * (i - taperSteps)) / taperSteps
//             );
//             ctx.stroke();
//         }
//     }
//     // Update the last position to the current cursor position
//     lastX = x;
//     lastY = y;

// });

const slider = document.getElementById("slider-input");
const value = document.getElementById("slider-value");
const audio = document.getElementById("audio");

value.textContent = slider.value;
audio.volume = slider.value / 100;

slider.addEventListener("input", function() {
    const volume = this.value / 100;
    value.textContent = this.value;
    audio.volume = volume;
});