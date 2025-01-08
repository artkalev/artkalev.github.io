/**
 * 
 * @param {HTMLElement} parent 
 * @param {HTMLImageElement[]} images 
 */
function createImageGallery(parent, images){
    console.log("start");
    const root = document.createElement("div");
    root.style.position = "relative";

    root.style.width = "100%";
    root.style.height = "auto";
    root.style.aspectRatio = "16/9";
    root.style.overflow = "hidden";
    root.style.borderStyle = "solid";
    root.style.borderColor = "green";

    const btn_prev = document.createElement("button");
    btn_prev.textContent = "previous";
    btn_prev.style.position = "absolute";
    btn_prev.style.top = "50%";
    btn_prev.style.zIndex = "100";
    btn_prev.style.transform = "translateY(-50%)";
    btn_prev.style.height = "100px";
    const btn_next = document.createElement("button");
    btn_next.textContent = "next";
    btn_next.style.position = "absolute";
    btn_next.style.right = "0px";
    btn_next.style.top = "50%";
    btn_next.style.zIndex = "100";
    btn_next.style.transform = "translateY(-50%)";
    btn_next.style.height = "100px";

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