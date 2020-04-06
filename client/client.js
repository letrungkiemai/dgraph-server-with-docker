
var loadElement = document.getElementById("load");
loadElement.onclick = function () {
  fetch('http://localhost:4000/')
    .then((response) => {
      return response.json();
    })
    .then((data) => {
      var h2 = document.getElementById('loaded');
      h2.innerHTML = 'Graph data loaded sucessfully!';
    });
}



var pplElement = document.getElementById("ppl");

pplElement.onclick = function () {
  fetch('http://localhost:4000/people')
  .then((response) => {
    return response.json();
  })
  .then((data) => {
    var div = document.getElementById('first_res');
    div.innerHTML = JSON. stringify(data);
  });
}

var aliceElement = document.getElementById("alice");

aliceElement.onclick = function () {
  fetch('http://localhost:4000/alice')
  .then((response) => {
    return response.json();
  })
  .then((data) => {
    var div = document.getElementById('second_res');
    div.innerHTML = JSON.stringify(data);
  });
}
