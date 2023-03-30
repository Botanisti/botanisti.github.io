var aikaaKappaleet = "Aikaa Kappaleen Lähettämiseen";
var aikaaArviointiin = "Aikaa Arvoinnin Lähettämiseen";
var aikaaPisteytykseen = "Aikaa Pisteiden Lähettämiseen";
// Declaring global variable outside the function
myFunction();
// Global variable accessed from
// Within a function
function myFunction() {
   document.getElementById("aikaa").innerHTML = aikaaPisteytykseen;
}
// Changing value of global
// Variable from outside of function