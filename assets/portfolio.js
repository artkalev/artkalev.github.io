console.log("start");

const port_items = document.querySelectorAll(".portfolio-item");

const onMouseMove = (e)=>{
    const x = e.offsetX;
    const y = e.offsetY;

    // pos in the range of -0.5 to +0.5
    const nx = (e.offsetX / e.target.clientWidth) - 0.5;
    const ny = (e.offsetY / e.target.clientHeight) - 0.5;

    //e.target.style.transform = `rotateY(${nx * 60.0}deg) rotateX(${ny * -60.0}deg)`;
}

for(let i = 0; i < port_items.length; i++){
    //port_items[i].addEventListener("mousemove", onMouseMove);
}