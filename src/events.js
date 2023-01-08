function leftClickProcess(e) {
  e.preventDefault();
  e.stopPropagation();
  if (e.button != 0) {
    return;
  }
  mouseState = "down";
  document.addEventListener("mousemove", mouseDragProcess);
  document
    .querySelector("#torrent-quicksearch-overlay")
    .style.setProperty("--icon-padding", `${paddingLarge}vh`);
}

function mouseUpProcess(e) {
  e.preventDefault();
  e.stopPropagation();
  mouseClicksProcess();
  resetMouse();
}

async function mouseClicksProcess() {
  if (mouseState == "dragged") {
    return;
  } else if (Date.now() - lastClick < clickLimit) {
    return;
  } else if (verifyConfig() == false) {
    GM.notification(
      "At Minimum You Need to Set\nSearch URl\nSearch API\nSearch Program",
      program,
      searchIcon
    );
    GM_config.open();
    return;
  }
  lastClick = Date.now();
  await searchObj.toggleSearch();
}
//Reset Mouse Events
function resetMouse() {
  mouseState = "up";
  document
    .querySelector("#torrent-quicksearch-overlay")
    .style.setProperty("--icon-padding", `${paddingSmall}vh`);
  document.removeEventListener("mousemove", mouseDragProcess);
}

function mouseDragProcess(e) {
  mouseState = "dragged";
  //check mouse state on enter
  if (mouseState == "up" || e.buttons == 0) {
    return;
  }
  //poll mouse state
  setInterval(
    () => {
      if (mouseState == "up" || e.buttons == 0) {
        return;
      }
    },

    1000
  );

  let dragState = true;
  let toggleHeight = parseInt(
    getComputedStyle(
      document.querySelector("#torrent-quicksearch-toggle")
    ).height.replaceAll(/[^0-9.]/g, "")
  );
  let startMousePosition = parseInt(e.clientY);
  let offsetMousePosition = startMousePosition - toggleHeight / 2;
  let viewport = (offsetMousePosition / window.innerHeight) * 100;
  viewport = Math.max(viewport, -20);
  viewport = Math.min(viewport, 89);openMainMenu
  document.querySelector(
    "#torrent-quicksearch-overlay"
  ).style.top = `${viewport}vh`;
}

function filterEvent(e){
  e.preventDefault()
  e.stopPropagation()
  filterconfig.open()
}

async function testIndexerEvent(e){
  let indexers=null
  try{
    indexers=await getIndexers({
      searchprogram:GM_config.fields.searchprogram.node.value,
      searchapi:GM_config.fields.searchapi.node.value,
      searchurl:GM_config.fields.searchurl.node.value
    })
  }catch{
  null
  }
 
  if (indexers!=null){
    alert("Test Successful\nMake Sure to Save and Edit Indexers")
  }
  else{
    alert("Error With Search Settings")
  }
}