window.addEventListener("load", function() {
    document.querySelector("header").style.display = "none";
    document.querySelector("main").style.display = "none";
    document.querySelector("body").style.overflow = "hidden";

    setTimeout(function() {
        document.querySelector("header").style.display = "flex";
        document.querySelector("main").style.display = "block";
        document.querySelector("body").style.overflow = "scroll";
        document.querySelector("#loading").style.display = "none";
    }, 200);
});