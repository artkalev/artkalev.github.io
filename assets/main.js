/**
 * 
 * @param {HTMLElement} parent 
 * @param {HTMLImageElement[]} images 
 */
function createImageGallery(parent, images){
    console.log("start");
    const root = document.createElement("div");
    root.style.position = "relative";
    root.setAttribute("currentImage", "0");

    root.style.width = "100%";
    root.style.height = "auto";
    const aspect = images[0].width / images[1].height;
    root.style.aspectRatio = aspect;
    root.style.overflow = "hidden";
    root.style.borderStyle = "solid";
    root.style.borderColor = "green";

    const btn_prev = document.createElement("button");
    btn_prev.textContent = "previous";
    btn_prev.style.position = "absolute";
    btn_prev.style.left = "0px";
    btn_prev.style.top = "50%";
    btn_prev.style.zIndex = "100";
    btn_prev.style.transform = "translateY(-50%)";
    btn_prev.style.height = "100px";

    btn_prev.onclick = ()=>{
        let i = parseInt(root.getAttribute("currentImage"));
        i--;
        if(i < 0){
            i = images.length-1;
        }

        setImage(i);
    };

    const btn_next = document.createElement("button");
    btn_next.textContent = "next";
    btn_next.style.position = "absolute";
    btn_next.style.right = "0px";
    btn_next.style.top = "50%";
    btn_next.style.zIndex = "100";
    btn_next.style.transform = "translateY(-50%)";
    btn_next.style.height = "100px";

    /**
     * 
     * @param {number} index 
     */
    const setImage = (index) => {
        img_slider.style.transform = `translateX(${index * -100}%)`;
        root.setAttribute("currentImage", index.toString());
    };

    btn_next.onclick = ()=>{
        let i = parseInt(root.getAttribute("currentImage"));
        i++;
        if(i >= images.length){
            i = 0;
        }

        setImage(i);
    };

    const img_win = document.createElement("div");
    img_win.style.height = "100%";
    img_win.style.whiteSpace = "nowrap";

    const img_slider = document.createElement("div");
    img_slider.style.display = "flex";
    for(let i = 0; i < images.length; i++){
        img_slider.appendChild(images[i]);
        images[i].style.width = "100%";
        images[i].style.height = "auto";
        images[i].style.display = "inline-block";
        images[i].style.objectFit = "cover";
        images[i].style.flexShrink = "0";
    } 
    img_win.appendChild(img_slider);

    root.appendChild(img_win);
    root.appendChild(btn_prev);
    root.appendChild(btn_next);

    parent.appendChild(root);
}

console.log("main.js");