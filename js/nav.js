document.getElementById("name-container").setAttribute("style", "display:none");

var position = $(window).scrollTop();
console.log("dddd")
$(window).scroll(function () {

  var scroll = $(window).scrollTop();
  console.log("dddd1")
  if (scroll > position) {

    document.getElementById("name-container").setAttribute("style", "");
    document.getElementsByClassName("menus_items")[1].setAttribute("style", "display:none!important");

  } else {


    document.getElementsByClassName("menus_items")[1].setAttribute("style", "");
    document.getElementById("name-container").setAttribute("style", "display:none");

  }

  position = scroll;

});
function scrollToTop(){
    document.getElementsByClassName("menus_items")[1].setAttribute("style","");
    document.getElementById("name-container").setAttribute("style","display:none");
    btf.scrollToDest(0, 500);
}
document.getElementById("page-name").innerText = document.title.split(" |")[0];