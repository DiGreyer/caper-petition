(function () {
    console.log("Yup, everything runs!");

    const canvas = $("canvas");
    const canvasContext = canvas[0].getContext("2d");
    let mouseDown = false;
    let offset = canvas.offset();
    let left;
    let top;
    let dataURL;

    canvas
        .on("mousedown", (e) => {
            mouseDown = true;
            left = e.clientX - offset.left;
            top = e.clientY - offset.top;
            canvasContext.moveTo(left, top);
        })
        .on("mousemove", (event) => {
            if (mouseDown) {
                event.stopPropagation();
                left = event.clientX - offset.left;
                top = event.clientY - offset.top;
                canvasContext.lineTo(left, top);
                canvasContext.stroke();
                dataURL = canvas[0].toDataURL();
                $("#signature").val(dataURL);
            }
        });

    $("body").on("mouseup", (event) => {
        mouseDown = false;
        event.stopPropagation();
        // console.log("This is the dataURL: ", dataURL);
    });
})();
