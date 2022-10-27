
function setTitleNode() {
  if (customSearch == false) {
    document.querySelector("#torrent-quicksearch-customsearch").value =
      getTitle();
  }
}
async function setIMDBNode() {
  let imdb = null;
  //Get Old IMDB
  if (
    document.querySelector("#torrent-quicksearch-imdbinfo").textContent !=
      imdbParserFail &&
    document.querySelector("#torrent-quicksearch-imdbinfo").textContent
      .length != 0 &&
    document.querySelector("#torrent-quicksearch-imdbinfo").textContent !=
      "None"
  ) {
    imdb = document.querySelector("#torrent-quicksearch-imdbinfo").textContent;
  }
  //Else get New IMDB
  else {
    imdb = await getIMDB();
    document.querySelector("#torrent-quicksearch-imdbinfo").textContent =
      imdb || imdbParserFail;
  }
  return imdb;
}
function resetSearchDOM() {
  document.querySelector("#torrent-quicksearch-imdbinfo").textContent = "None";
  document.querySelector("#torrent-quicksearch-msgnode").textContent =
    "Waiting";
}

function hideDisplay() {
  document
    .querySelector("#torrent-quicksearch-overlay")
    .style.setProperty("--icon-size", `${iconSmall}%`);
  document.querySelector("#torrent-quicksearch-customsearch").value = "";
  document.querySelector("#torrent-quicksearch-box").style.display = "none";
}

function showDisplay() {
  document.querySelector("#torrent-quicksearch-msgnode").textContent = "";
  document.querySelector("#torrent-quicksearch-msgnode").style.display =
    "block";
  document
    .querySelector("#torrent-quicksearch-overlay")
    .style.setProperty("--icon-size", `${iconLarge}%`);
  document.querySelector("#torrent-quicksearch-box").style.display =
    "inline-block";
}

function getTableHead() {
  let node = document.querySelector("#torrent-quicksearch-resultheader");
  node.innerHTML = `
       <span class="torrent-quicksearch-resultcell"  >Links</span>
       <span class="torrent-quicksearch-resultcell"  >Clients</span>
    <span class="torrent-quicksearch-resultcell"  >Title</span>
    <span class="torrent-quicksearch-resultcell"  >Indexer</span>
    <span class="torrent-quicksearch-resultcell"  >Grabs</span>
    <span class="torrent-quicksearch-resultcell"  >Seeders</span>
    <span class="torrent-quicksearch-resultcell"  >Leechers</span>
  <span class="torrent-quicksearch-resultcell"  >DLCost</span>
    <span class="torrent-quicksearch-resultcell"  >Date</span>
    <span class="torrent-quicksearch-resultcell">Size</span>
    <span class="torrent-quicksearch-resultcell">IMDB</span>

`;

  Array.from(node.children).forEach((e, i) => {
    e.style.gridColumnStart = i + 1;
    e.style.fontSize = `${GM_config.get("fontsize", 12)}px`;
  });
}

function addResultsTable(data) {
  if (data.length == 0) {
    return;
  }
  let resultList = document.querySelector("#torrent-quicksearch-resultlist");
  let tempFrag = new DocumentFragment();

  data.forEach((e, i) => {
    let node = document.createElement("span");
    node.setAttribute("class", "torrent-quicksearch-resultitem");
    node.innerHTML = `
    <span class="torrent-quicksearch-resultcell torrent-quicksearch-links"  style='grid-column-start:1' >
        <a href=${e["DownloadUrl"]}>Download</a>
         <br>
        <br>
        <a href=${e["InfoUrl"]}>Details</a>
  </span>
    <span style='grid-column-start:2'>
      <form>
      <span>
      <select class=torrent-quicksearch-clientSelect>
      </select>
      </span>
        <span>
          <span class="tooltip">
        <button class=torrent-quicksearch-clientSubmit>Send</button>
  <span class="tooltiptext">Arr Clients imdbID sent from entry if null then page</span>
      </span>
        </span>
       </form>



  </span>
    <span class="torrent-quicksearch-resultcell" style='grid-column-start:3' >${
      e["Title"]
    }</span>
    <span class="torrent-quicksearch-resultcell" style='grid-column-start:4'  >${
      e["Indexer"]
    }</span>
    <span class="torrent-quicksearch-resultcell" style='grid-column-start:5'>${
      e["Grabs"] || "No Data"
    } </span>
  <span class="torrent-quicksearch-resultcell" style='grid-column-start:6'>${
    e["Seeders"] || "No Data"
  } </span>
  <span class="torrent-quicksearch-resultcell" style='grid-column-start:7' >${
    e["Leechers"] || "No Data"
  } </span>
 <span class="torrent-quicksearch-resultcell" style='grid-column-start:8'>${
   e["Cost"]
 } </span>
 <span class="torrent-quicksearch-resultcell" style='grid-column-start:9' >${new Date(
   e["PublishDate"]
 ).toLocaleString("en-CA")}</span>
 <span class="torrent-quicksearch-resultcell" style='grid-column-start:10' >${(
   parseInt(e["Size"]) / 1073741824
 ).toFixed(2)} GB</span>
<span class="torrent-quicksearch-resultcell" style='grid-column-start:11' >${
      e["ImdbId"]
    }</span>`;

    let selNode = node.querySelector("select");

    JSON.parse(GM_config.getValue("downloadClients", "[]")).forEach((e) => {
      let optnode = document.createElement("option");
      optnode.setAttribute("id", e.clientID);
      optnode.setAttribute("value", e.clientID);
      optnode.textContent = e.clientName;
      selNode.appendChild(optnode);
    });
    node.querySelector("form").addEventListener("submit", clientFactory(e));

    tempFrag.append(node);
  });

  resultList.appendChild(tempFrag);
}

function resetResultList() {
  document.querySelector("#torrent-quicksearch-resultheader").textContent = "";
  document.querySelector("#torrent-quicksearch-resultlist").textContent = "";
}

function createMainDOM() {
  const box = document.createElement("div");
  box.setAttribute("id", "torrent-quicksearch-overlay");
  let rowSplit = 12;
  let contentWidth = 70;
  let boxMinHeight = 5;
  let boxMaxHeight = 100;
  let boxHeight = 40;
  let boxWidth = 70;
  let boxMaxWidth = 150;
  box.innerHTML = `
 <div>
  <img id="torrent-quicksearch-toggle" src="${searchIcon}"></img>
<div id="torrent-quicksearch-box">
<div id="torrent-quicksearch-content">
  <div>
  <div id="torrent-quicksearch-msgnode"></div>
  <div id="torrent-quicksearch-custombox">
        <div>
      <label>Title:</label>
    <input type="text" id="torrent-quicksearch-customsearch">
     <label>Page IMDB:</label>
    <div id="torrent-quicksearch-imdbinfo">None</div>
    <button id="torrent-quicksearch-customsearchbutton">Custom Search</button>
        </div>
  </div>
    <div id="torrent-quicksearch-resultheader"></div>
</div>


  <div id="torrent-quicksearch-resultlist">
  </div>

    </div>
</div>
<style>
  /*     Variables */
  #torrent-quicksearch-overlay {
  --grid-size: max(calc(50vw/${rowSplit}),calc(100%/${rowSplit}));
  --icon-size:${iconSmall}%;
    --icon-padding:${paddingSmall}%;

  }
   #torrent-quicksearch-overlay {
       position: sticky;
       display: flex;
       flex-direction: column;
       gap: 10px;
       top: 40vh;
       pointer-events: none;
       z-index: 900000;
   }


    #torrent-quicksearch-overlay> div:first-of-type {
       position: absolute;
       left:80vw;

   }

 * {
    font-size:${GM_config.get("fontsize", 12)}px;
  }



  #torrent-quicksearch-toggle {
  margin-left: auto;
  display:block;
  cursor: pointer;
  pointer-events:all;
  width:  var(--icon-size);
  height:  var(--icon-size);
  padding-top: var(--icon-padding);
  padding-bottom:var(--icon-padding);
    margin-bottom:calc(${paddingLarge}vh - var(--icon-padding));
  margin-top:calc(${paddingLarge}vh - var(--icon-padding));
}
    #torrent-quicksearch-box{
  resize:both;
  direction:rtl;
   right:5vw;
  margin-right:auto;
  position:absolute;
  display:none;
  min-height: ${boxMinHeight}vh;
  max-height:${boxMaxHeight}vh;
  height: ${boxHeight}vh;
  width: ${boxWidth}vw;
  max-width: ${boxMaxWidth}vw;
  overflow:hidden;
  border:solid black 5px;
  }


  #torrent-quicksearch-msgnode{
    background-color:#FFFFFF;
    width:calc(var(--grid-size)*${rowSplit});
    display:none;
  height:calc(((${GM_config.get("fontsize", 12)}em) + 2em)/16);

  }

     #torrent-quicksearch-custombox {
      background-color:#FFFFFF;
      width:calc(var(--grid-size)*${rowSplit});
         pointer-events:all;
         height:calc(((${GM_config.get("fontsize", 12)}em) + 2em) * (2/16));


   }

    #torrent-quicksearch-custombox>div {
       display: flex;
      background-color:#FFFFFF;
      flex-direction:row;
      justify-content: center;
       width: 100%

   }
  #torrent-quicksearch-custombox>div >label {
       margin-left:2.5%;
           margin-right:2.5%;

   }
    #torrent-quicksearch-custombox>div >button {
       margin-left:2.5%;


   }

    #torrent-quicksearch-customsearch{
    background-color:#FFFFFF;
   border:solid black 2px;
  flex-grow:1;

  }

  #torrent-quicksearch-custombox > label{
  margin-left:2%
  margin-right:2%
  }
  #torrent-quicksearch-customsearchbutton {
  background-color: #4CAF50;
  border: none;
  color: white;
  text-align: center;
  text-decoration: none;
  font-size: ${GM_config.get("fontsize", 12) + 2}px;
    border-radius: 5px;
}

  #torrent-quicksearch-content {
  pointer-events:all;
  background-color:  #D7C49EFF;
   direction:ltr;
  height:100%;
  width:100%;
}

  #torrent-quicksearch-content>div:nth-child(2) {
  scrollbar-color: white;
  overflow:scroll;
  width:100%;
  height:calc(100% - ((${GM_config.get("fontsize", 12)}em) + 2em)*(4/16));

}

    #torrent-quicksearch-content>div:nth-child(1) {
  width:100%;
   background-color: #B1D79E;
}



    #torrent-quicksearch-resultlist{
    border:solid white 5px;
    width:calc(var(--grid-size)*${rowSplit});

  }

  .torrent-quicksearch-resultitem,#torrent-quicksearch-resultheader{
  display: grid;
    grid-template-columns: repeat(${rowSplit},var(--grid-size));
    width:calc((var(--grid-size)*${rowSplit})-10);
  }

  .torrent-quicksearch-resultitem{
    font-size:${GM_config.get("fontsize", 12)}px;
  }

  #torrent-quicksearch-resultlist>.torrent-quicksearch-resultitem:nth-child(even) {
  background-color: #D7C49EFF;
}
 #torrent-quicksearch-resultlist>.torrent-quicksearch-resultitem:nth-child(odd) {
  background-color: #d5cbcb;
}
  #torrent-quicksearch-resultheader{
background-color: #B1D79E;
  font-size:${GM_config.get("fontsize", 12) + 2}px;
      height:calc(((${GM_config.get("fontsize", 12)}em) + 2em)*(2/16));

  }

  .torrent-quicksearch-resultcell{
  font-weight: bold;
        margin-left: 10%;
overflow-wrap:break-word;
  }


  .torrent-quicksearch-clientSubmit {
  background-color: white;
  border: none;
  text-align: center;
  text-decoration: none;
 font-size:${GM_config.get("fontsize", 12) + 2}px;
    font-weight: bold;
  overflow: hidden;
white-space: nowrap;
    width:100%''

}


  .torrent-quicksearch-clientSelect {
 font-size:${GM_config.get("fontsize", 12) + 2}px;
font-weight: bold;
       width:100%;

}


     .torrent-quicksearch-links *{
  color:blue;
  cursor:pointer;
  text-decoration: none;
  }
     .torrent-quicksearch-links *:hover{
  color:white;
  }

.torrent-quicksearch-links *:active,focus{
   animation: pulse 2s infinite;
  }


  @keyframes pulse {
  0% ,100%{
    color: blue;
  }
  50% {
    color: white;
  }
}
  ::-webkit-scrollbar-thumb{
  background-color:white;

  }
  /* Tooltip container */
.tooltip {
  position: relative;
  display: inline-block;
  border-bottom: 1px dotted black; /* If you want dots under the hoverable text */
}

/* Tooltip text */
.tooltip .tooltiptext {
  visibility: hidden;
  width: 120px;
  background-color: black;
  color: #fff;
  text-align: center;
  padding: 5px 0;
  border-radius: 6px;

  /* Position the tooltip text - see examples below! */
  position: absolute;
  z-index: 1;
}

/* Show the tooltip text when you mouse over the tooltip container */
.tooltip:hover .tooltiptext {
  visibility: visible;
}




<style/>`;

  box
    .querySelector("#torrent-quicksearch-toggle")
    .addEventListener("mousedown", leftClickProcess);
  box
    .querySelector("#torrent-quicksearch-toggle")
    .addEventListener("mouseup", mouseUpProcess);
  document.addEventListener("mouseup", resetMouse);

  box
    .querySelector("#torrent-quicksearch-customsearchbutton")
    .addEventListener("click", () => {
      searchObj.cancel();
      setTimeout(() => {
        if (Date.now() - lastClick < clickLimit) {
          return;
        }

        lastClick = Date.now();
        let customSearch = true;
        searchObj.doSearch();
      }, 0);
    });
  document.body.insertBefore(box, document.body.children[0]);
}
