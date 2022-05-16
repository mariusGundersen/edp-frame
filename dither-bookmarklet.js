javascript: (function () {
  var svg = document.createElement("template");
  var quality = prompt(
    "What quality do you want? Specify a number between 1 and 10. 6 will give you web safe colors",
    "1"
  );

  if (!quality) return;
  var values = "0 ";
  for (var i = 0; i < quality; i++) {
    values += (i / quality).toFixed(2) + " ";
  }
  values += "1";
  svg.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" xmlns:xlink="http://www.w3.org/1999/xlink">
      <filter id="fdither" color-interpolation-filters="sRGB" x="0%" y="0%" width="100%" height="100%" primitiveUnits="userSpaceOnUse" filterUnits="objectBoundingBox">
        <feImage xlink:href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAkElEQVQYV1WOsQnGIBBG73CADGPvGikEG8HGGUwRZ0gj2AgWbuEA7uIAKfJzBwm/1fGK791DIcRzHAeUUiCEAN57+GfsvT/neULOGWKM4JyDl+milPKhpbWWl601vi/jnJMNxhg21FrZ8DJu27Y0aK3XhjHG10DLfd+/BjKiUooN9JNaUkprw33fS8N1XUvDD7mwZ+yAbH7nAAAAAElFTkSuQmCC" x="0" y="0" width="8" height="8" preserveAspectRatio="xMidYMid meet" crossorigin="anonymous" result="image"></feImage>
        <feTile x="0" y="0" in="image" result="tile" width="100%" height="100%"></feTile>
        <feComposite in="SourceGraphic" in2="tile" operator="arithmetic" k1="0" k2="1" k3="1" k4="-0.5" x="0%" y="0%" width="100%" height="100%" result="composite"></feComposite>
        <feComponentTransfer x="0%" y="0%" width="100%" height="100%" in="composite" result="componentTransfer">
          <feFuncR type="discrete" tableValues="${values}"></feFuncR>
          <feFuncG type="discrete" tableValues="${values}"></feFuncG>
          <feFuncB type="discrete" tableValues="${values}"></feFuncB>
          <feFuncA type="discrete" tableValues="1"></feFuncA>
        </feComponentTransfer>
      </filter>
    </svg> `;
  document.body.appendChild(svg.content);
  document.body.style.filter = "url('#fdither')";
  document.documentElement.style.background = "white";
})();
