
function setTitleNode() {
  if (customSearch == false) {
    document.querySelector("#torrent-quicksearch-customsearch").value = getTitle();
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
  document.querySelector("#torrent-quicksearch-filter").style.display = "none";

}

function showDisplay() {
  document.querySelector("#torrent-quicksearch-msgnode").textContent = "";
  document.querySelector("#torrent-quicksearch-msgnode").style.display =
    "block";
  document
    .querySelector("#torrent-quicksearch-overlay")
    .style.setProperty("--icon-size", `${iconLarge}%`);
  document.querySelector("#torrent-quicksearch-box").style.display =
    "block";
  document.querySelector("#torrent-quicksearch-filter").style.display = "block";

}

function getTableHead() {
  let node = document.querySelector("#torrent-quicksearch-resultheader");
  node.innerHTML = `
       <span class="torrent-quicksearch-resultcell" >Links</span>
       <span class="torrent-quicksearch-resultcell" >Clients</span>
    <span class="torrent-quicksearch-resultcell"  >Title</span>
    <span class="torrent-quicksearch-resultcell"  >Indexer</span>

    <span class="torrent-quicksearch-tooltip">
    <span class="torrent-quicksearch-resultcell">L/S/G</span>
<span class="torrent-quicksearch-tooltiptext">Leechers/Seeders/Grabs</span>
</span>

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
          <span class="torrent-quicksearch-tooltip">
        <button class=torrent-quicksearch-clientSubmit>Send</button>
  <span class="torrent-quicksearch-tooltiptext">Add Release to client</span>
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
      `${e["Leechers"] || "?"} / ${e["Seeders"] || "?"} / ${e["Grabs"] || "?"}`
    } </span>
 
 <span class="torrent-quicksearch-resultcell" style='grid-column-start:6'>${
   e["Cost"]
 } </span>
 <span class="torrent-quicksearch-resultcell" style='grid-column-start:7' >${new Date(
   e["PublishDate"]
 ).toLocaleString("en-CA")}</span>
 <span class="torrent-quicksearch-resultcell" style='grid-column-start:8' >${(
   parseInt(e["Size"]) / 1073741824
 ).toFixed(2)} GB</span>
<span class="torrent-quicksearch-resultcell" style='grid-column-start:9' >${
      e["ImdbId"]
    }</span>
    <span class="torrent-quicksearch-resultcell" style='display:none' >${
      e["Type"]
    }</span>
    
    `;

    let selNode = node.querySelector("select");

    JSON.parse(GM_config.getValue("downloadClients", "[]")).forEach((e) => {
      let optnode = document.createElement("option");
      optnode.setAttribute("id", e.clientID);
      optnode.setAttribute("value", e.clientID);
      optnode.textContent = e.clientName;
      selNode.appendChild(optnode);
    });
    node.querySelector("form").addEventListener("submit", clientFactory(e));
    node=filterResults([node])[0]
    tempFrag.append(node);
  });

  resultList.appendChild(tempFrag);
}

function resetResultList() {
  document.querySelector("#torrent-quicksearch-resultheader").textContent = "";
  document.querySelector("#torrent-quicksearch-resultlist").textContent = "";
}



function createMainDOM() {
  //box is flexbox with sticky position
  //first div is position absolutely within flexbox div
  //search box also has an absolute position
  const box = document.createElement("div");
  box.setAttribute("id", "torrent-quicksearch-overlay");
  let rowSplit = 10;
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
    <input type="text" id="torrent-quicksearch-customsearch" placeholder="title">
    <button id="torrent-quicksearch-customsearchbutton">Custom Search</button>

     <label>IMDB Match:</label>
    <div id="torrent-quicksearch-imdbinfo">None</div>
        </div>
  </div>
    <div id="torrent-quicksearch-resultheader"></div>
</div>


  <div id="torrent-quicksearch-resultlist">
  </div>

    </div>
</div>

<?xml version="1.0" ?><svg id=torrent-quicksearch-filter width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
<path fill-rule="evenodd" clip-rule="evenodd" d="M46 39.1424L68 13.9995L12 13.9995L34 39.1424L34 65.9995L46 56.1172V39.1424Z" fill="#d5cbcb" />
<path d="M12 13.9995L68 13.9995L40 45.9995L12 13.9995Z" fill="#D7C49EFF" />
</svg>
<style>
  /*     Variables */
  #torrent-quicksearch-overlay {
  --grid-size: max(calc(50vw/${rowSplit}),calc(105%/${rowSplit}));
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

#torrent-quicksearch-filter {
  display:none;
  cursor: pointer;
  pointer-events:all;
  right:5vw;
  position:absolute;
  width: calc(${iconSmall}% + 4%);
  height:calc(${iconSmall}% + 4%);
}

#torrent-quicksearch-filter:hover {
  cursor: pointer;
  pointer-events:all;
  width:  calc(${iconSmall}% + 12%);
  height: calc(${iconSmall}% + 12%);
  right:5vw;
  position:absolute;
}
#torrent-quicksearch-filter:active {
  cursor: pointer;
  pointer-events:all;
  width:  calc(${iconSmall}% + 10%);
  height: calc(${iconSmall}% + 10%);
  right:5vw;
  position:absolute;
  opacity:0.6;
}
    #torrent-quicksearch-box{
  resize:both;
  direction:rtl;
   right:10vw;
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
       width: 90%

   }
  #torrent-quicksearch-custombox>div >label {
       margin-left:2.5%;
           margin-right:2.5%;

   }
    #torrent-quicksearch-custombox>div >button {
       margin-left:0%;


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

  .torrent-quicksearch-hiddenresultitem{
    display:none;
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
  /* torrent-quicksearch-tooltip container */
.torrent-quicksearch-tooltip {
  position: relative;
  display: inline-block;
  border-bottom: 1px dotted black; /* If you want dots under the hoverable text */
}

/* torrent-quicksearch-tooltip text */
.torrent-quicksearch-tooltip .torrent-quicksearch-tooltiptext {
  visibility: hidden;
  width: 120px;
  background-color: black;
  color: #fff;
  text-align: center;
  padding: 5px 0;
  border-radius: 6px;

  /* Position the torrent-quicksearch-tooltip text - see examples below! */
  position: absolute;
  z-index: 1;
}

/* Show the torrent-quicksearch-tooltip text when you mouse over the torrent-quicksearch-tooltip container */
.torrent-quicksearch-tooltip:hover .torrent-quicksearch-tooltiptext {
  visibility: visible;
}




<style/>`;
box
.querySelector("#torrent-quicksearch-filter")
.addEventListener("click", filterEvent);

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
        customSearch = true;
        searchObj.doSearch();
      }, 0);
    });
  document.body.insertBefore(box, document.body.children[0]);

}

function filterResults(nodeArray){
  for(i in nodeArray){
    let nodeElement=nodeArray[i]
    let LSG=nodeElement.querySelectorAll(".torrent-quicksearch-resultcell")[3].textContent.split("/")
    let leechers=LSG[0].replace(/ +/g,"")
    let seeders=parseInt(LSG[1].replace(/ +/g,""))
    let freeleech=parseInt(nodeElement.querySelectorAll(".torrent-quicksearch-resultcell")[4].textContent.replace(/\D+/,""))
    let size=parseInt(nodeElement.querySelectorAll(".torrent-quicksearch-resultcell")[6].textContent.replace("GB","").replace(/ +/g,""))
    let date=Date.parse(nodeElement.querySelectorAll(".torrent-quicksearch-resultcell")[5].textContent.split(",")[0])
    let type=nodeElement.querySelectorAll(".torrent-quicksearch-resultcell")[8].textContent
    if(filterconfig.get("torrentDownload")==false&&type=="torrent"){
      nodeElement.setAttribute("class","torrent-quicksearch-hiddenresultitem")
    }
    else if(filterconfig.get("nzbDownload")==false&&type=="nzbget"){
      nodeElement.setAttribute("class","torrent-quicksearch-hiddenresultitem")
    }
    else if (size!=null &&filterconfig.get("maxSize")!==-1 &&parseInt(filterconfig.get("maxSize"))<size){
      nodeElement.setAttribute("class","torrent-quicksearch-hiddenresultitem")
    }

    else if (size!=null && parseInt(filterconfig.get("minSize"))>size){
      nodeElement.setAttribute("class","torrent-quicksearch-hiddenresultitem")
    }

   else if (seeders!=null&&filterconfig.get("maxSeeders")!==-1 &&parseInt(filterconfig.get("maxSeeders"))<seeders){
      nodeElement.setAttribute("class","torrent-quicksearch-hiddenresultitem")
    }

    else if (seeders!=null&&parseInt(filterconfig.get("minSeeders"))>seeders){
      nodeElement.setAttribute("class","torrent-quicksearch-hiddenresultitem")
    }

    
   else if (leechers!=null&&filterconfig.get("maxLeechers")!==-1 &&parseInt(filterconfig.get("maxLeechers"))<leechers){
    nodeElement.setAttribute("class","torrent-quicksearch-hiddenresultitem")
  }

  else if (leechers!=null&&parseInt(filterconfig.get("minLeechers"))>leechers){
    nodeElement.setAttribute("class","torrent-quicksearch-hiddenresultitem")
  }
  else if (freeleech!=null&&parseInt(filterconfig.get("minFreeleech"))>freeleech){
    nodeElement.setAttribute("class","torrent-quicksearch-hiddenresultitem")
  }
  
  else if (date!=null &&Date.parse(filterconfig.get("youngerThan"))<date){
    nodeElement.setAttribute("class","torrent-quicksearch-hiddenresultitem")
  }

  else if (date!=null&&Date.parse(filterconfig.get("olderThan"))>date){
    nodeElement.setAttribute("class","torrent-quicksearch-hiddenresultitem")
  }
    else{
      nodeElement.setAttribute("class","torrent-quicksearch-resultitem")

    }
    
  }
  return nodeArray.filter((e)=>e.getAttribute("class","torrent-quicksearch-resultitem"))
}