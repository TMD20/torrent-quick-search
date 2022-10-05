// ==UserScript==
// @name        Torrent Quick Search
// @namespace  https://github.com/TMD20/torrent-quick-search
// @supportURL https://github.com/TMD20/torrent-quick-search
// @downloadURL https://greasyfork.org/en/scripts/452502-torrent-quick-search
// @version     1.1.3
// @description Toggle for Searching Torrents via Search aggegrator
// @icon        https://cdn2.iconfinder.com/data/icons/flat-icons-19/512/Eye.png
// @author      tmd
// @noframes
// @inject-into page
// @run-at document-end
// @require https://openuserjs.org/src/libs/sizzle/GM_config.min.js
// @grant              GM_getValue
// @grant              GM_setValue
// @grant GM.xmlhttpRequest
// @grant GM.registerMenuCommand
// @grant GM.notification
// @match https://animebytes.tv/requests.php?action=viewrequest&id=*
// @match https://animebytes.tv/series.php?id=*
// @match https://animebytes.tv/torrents.php?id=*
// @match https://blutopia.xyz/requests/*
// @match https://blutopia.xyz/torrents/*
// @match https://beyond-hd.me/requests/*
// @match https://beyond-hd.me/torrents/*
// @match https://imdb.com/title/*
// @match https://www.imdb.com/title/*
// @match https://www.themoviedb.org/movie/*
// @match https://www.themoviedb.org/tv/*
// @license MIT
// ==/UserScript==
`
General Functions
Functions that don't fit in any other catergory
`

async function toggleSearch(e){
    content=document.querySelector("#searchcontent")

    if (content.style.visibility === "visible") {
      content.style.pointerEvents="none"
    document.querySelector("#toggle").style.height='2%'
      document.querySelector("#toggle").style.width='2%'
      content.style.visibility = "hidden";
    } else {
        content.style.pointerEvents="all"
      document.querySelector("#toggle").style.height='5%'
      document.querySelector("#toggle").style.width='5%'
      content.style.visibility = "visible";


      try{
          await doSearch()
      }
       catch(error) {
            GM.notification(error.toString(), program,searchIcon)
            document.querySelector("#toggle").style.height='2%'
            document.querySelector("#toggle").style.width='2%'
            document.querySelector("#searchcontent").style.visibility = "hidden";
            throw new Error(error);
       }


    }
}

async function doSearch(){
    document.querySelector("#msgnode").textContent="Loading"
    reqs=[]
    resetResultList()
    url=await getBaseURL()
    indexers=await getIndexers()
    getTableHead()
    document.querySelector("#msgnode").textContent="Fetching Results"
    imdb=getIMDB()
    data = await Promise.allSettled(indexers.map((e)=>searchIndexer(e,imdb)));
    addNumbers()
    console.log("Finished Fetching")
    document.querySelector("#msgnode").textContent="Finished"
  }

async function searchIndexer(indexerObj,imdb){
    console.log(`Fetching From ${indexerObj["name"]}`)
    req=await fetch(`${url}&indexerIds=${indexerObj["id"]}`)
    data=JSON.parse(req.responseText)
    filterData=data.filter((e)=>imdbFilter(e,imdb))
    processResults(JSON.parse(req.responseText))
}

function fetch(url){

  return new Promise((resolve, reject) => {
    GM.xmlhttpRequest( {
   'method' : 'GET',
   'url' : url,
    'responseType':"json",
   onload  : response => {
     resolve(response)
   },
   onerror : response => {
    reject(response.responseText)
   },
} )
})}

function getParser(){
  siteName=standardNames[window.location.host] || window.location.host
  data=infoParser[siteName]
  if (data===undefined){
   msg="Could not get Parser"
   GM.notification(msg, program,searchIcon)
   throw new Error(msg);

}
  return data
}

`
DOM Manipulators

These Functions are used to manipulate the DOM
`
function getTableHead(){
    resultList=document.querySelector("#resultlist")
    node=document.createElement("div");
    node.setAttribute("id","resulthead")
    node.innerHTML=`
    <div class="resultcell" style="font-size:${GM_config.get("fontsize",12)}px;grid-column-start:1">Number</div>
    <div class="resultcell"  style="font-size:${GM_config.get("fontsize",12)}px;grid-column-start:2">Title</div>
    <div class="resultcell"  style="font-size:${GM_config.get("fontsize",12)}px;grid-column-start:3">Indexer</div>
    <div class="resultcell"  style="font-size:${GM_config.get("fontsize",12)}px;grid-column-start:4">Grabs</div>
 <div class="resultcell"  style="font-size:${GM_config.get("fontsize",12)}px;grid-column-start:5">Date</div>
 <div class="resultcell"  style="font-size:${GM_config.get("fontsize",12)}px;grid-column-start:6">Size</div>
<div class="resultcell"  style="font-size:${GM_config.get("fontsize",12)}px;grid-column-start:7"></div>
<div class="resultcell"  style="font-size:${GM_config.get("fontsize",12)}px;grid-column-start:8"></div>`

  resultList.replaceChild(node, resultList.firstChild)

}

function processResults(data){
    if (data.length==0){
      return
    }
  data.forEach((e,i)=>{
    resultList=document.querySelector("#resultlist")
    node=document.createElement("div");
    node.setAttribute("class","resultitem")
    node.innerHTML=`
    <div class="resultcell"  style="font-size:${GM_config.get("fontsize",12)}px;grid-column-start:1">?</div>
    <div class="resultcell"  style="font-size:${GM_config.get("fontsize",12)}px;grid-column-start:2">${e['title']}</div>
    <div class="resultcell"  style="font-size:${GM_config.get("fontsize",12)}px;grid-column-start:3">${e['indexer']}</div>
    <div class="resultcell"  style="font-size:${GM_config.get("fontsize",12)}px;grid-column-start:4">${e['grabs']} </div>
 <div class="resultcell"  style="font-size:${GM_config.get("fontsize",12)}px;grid-column-start:5">${new Date(e['publishDate']).toLocaleString("en-CA")}</div>
 <div class="resultcell"  style="font-size:${GM_config.get("fontsize",12)}px;grid-column-start:6">${(parseInt(e['size'])/1073741824).toFixed(2)} GB</div>
<div class="resultcell"  style="font-size:${GM_config.get("fontsize",12)}px;grid-column-start:7"><a href=${e['downloadUrl']}>Download</a></div>
<div class="resultcell"  style="font-size:${GM_config.get("fontsize",12)}px;grid-column-start:8"><a href=${e['guid']}>Details</a></div>

  `
    resultList.appendChild(node)

  })

}

function resetResultList(){
  resultList=document.querySelector("#resultlist")
  resultList.innerHTML=
  `
    <div id="resulthead">
    <div id="msgnode">
  `
}

function addNumbers(){
  document.querySelectorAll(".resultitem").forEach((e,i)=>{
    e.firstElementChild.textContent=`${i}`

  }

  )
}

function createMainDOM(){
  const box = document.createElement("div");
box.setAttribute("id", "quicksearch");
box.innerHTML=`
<img id="toggle" src="${searchIcon}">
</img>
<div id="searchcontent">
  <div id="resultlist">
     <div id="resulthead">
    <div id="msgnode">
    </div>
  </div>
</div>
<style>
  #quicksearch{
    position:sticky;
    display:flex;
     flex-direction:column;
    gap: 10px;
    bottom:10vh;
    z-index:9999999999;
    pointer-events:none;

  }
  #toggle {
  margin-left:auto;
  color: white;
  cursor: pointer;
  pointer-events:all;
  width: 2%;
  height: 2%;
}
  #resultlist{
   overflow:scroll;
   scrollbar-color: white;
   height:100%;
   width:100%;
  }

  ::-webkit-scrollbar-thumb{
  background-color:white;

  }

  .resultitem:nth-child(even) {
  background-color: #D7C49EFF;
}
 .resultsitem:nth-child(odd) {
  background-color: #343148FF;
}

  .resultitem{
  display: grid;
  grid-template-columns: calc(100%/8) calc(100%/8) calc(100%/8) calc(100%/8) calc(100%/8) calc(100%/8) calc(100%/8) calc(100%/8);
  border:solid white 5px;
  }

  #resulthead{
  display: grid;
  grid-template-columns: calc(100%/8) calc(100%/8) calc(100%/8) calc(100%/8) calc(100%/8) calc(100%/8) calc(100%/8) calc(100%/8);
  border:solid white 5px;
  }

  .resultcell{
  font-weight: bold;
        margin-left: 10%;
overflow-wrap:break-word;
  }

.active, #toggle:hover {
}

#searchcontent {
  position:relative;
  visibility: hidden;
  background-color: #d5cbcb;
  min-height: 5vh;
  max-height:40vh;
  height: 40vh;
  width: 70vw;
  right:5vw;
  margin-left:auto;
  border:solid black 5px;
}

<style/>`

document.body.appendChild(box);
document.querySelector("#toggle").addEventListener("mousedown", leftClickProcess)
}
`
Title Functions
These Functions Help with Retriving Title/ID Information
`

function getTitle()
{

titleNode=document.querySelector(siteParser["title"])
title=titleNode[siteParser["titleAttrib"]]
title=titleCleanup(title)
console.log(`title:${title}`)
return title
}

function getIMDB()
{
let imdb=null

if (standardNames[window.location.host]=="imdb.com"){
  imdb=window.location.href
}
else{
imdbNode=document.querySelector(siteParser["imdb"])
if (imdbNode==null){
  msg="Parser: Could Not find IMDB"
  console.log(imdb)
  return null
}
imdb=imdbNode[siteParser["imdbAttrib"]]
}

imdb=imdbCleanup(imdb)
console.log(`imdb:${imdb}`)
return imdb
}

function titleCleanup(title){
  title=title.trim().replaceAll(/\n/g,"")
  title=title.replaceAll(/ +/g," ")
  return title
}

function imdbCleanup(imdb){
  if (imdb===null){
    return imdb
  }
  imdb=imdb.match(/[0-9]+/).toString()
  imdb=imdb.trim().replaceAll(/\n/g,"")
  imdb=imdb.replace(/imdb/i,"")
  imdb=imdb.replace(/tt/,"")
  imdb=imdb.replace(/[:|&|*|\(|\)|!|@|#|$|%|^|\*|\\|\/]/,"")
  imdb=imdb.replaceAll(/ +/g,"")
  imdb=imdb.replace(/^0+/,"")
  imdb=parseInt(imdb)
  return imdb

}

function imdbFilter(entry,imdb){
  if(imdb===null){
    return true
  }
  else if (entry["imdbId"]==0){
    return true
  }

  else if (entry["imdbId"]==imdb){
    return true
  }
  return False
}
`
URL Processing

These Functions are used to generate the URL used to retrive the data for user

`
async function getBaseURL(){
 return `${new URL('/api/v1/search',GM_config.get('url')).toString()}?query=${getTitle()}&${await createSearchParmas()}`

}
async function createSearchParmas(){
   let params = new URLSearchParams();
   params.append("apikey",GM_config.get('api'));
  return params.toString()
}

async function getIndexers(){
        document.querySelector("#msgnode").textContent="Getting Indexers"

        let params = new URLSearchParams();
        params.append("apikey",GM_config.get('api'));
        indexerURL=`${GM_config.get('url')}/api/v1/indexer?${params.toString()}`
        req=await fetch(indexerURL)
        indexerCacheHelper(JSON.parse(req.responseText))
        if(GM_config.get('listType')=="black"){
        return blackListHelper(JSON.parse(req.responseText))
        }
     else{
          return whiteListHelper(JSON.parse(req.responseText))
        }

}

  function filterCurrSite(indexers){
    if (GM_config.get('sitefilter')=="false"){
      return indexers
    }
    return indexers.filter((indexerObj)=>{
      sites=indexerObj["indexerUrls"]
      for(i in sites){
        if(new URL(sites[i]).hostname==window.location.host){
          return false
        }
        return true

      }

    })
  }

function indexerCacheHelper(allIndexers){
  indexerNames=GM_config.get('indexers').split(",").map((e)=>e.trim().toLowerCase())
 for (let j in indexerNames){
     cached=GM_getValue(indexerNames[j],"none")
     if (cached!="none"){
       continue
     }
     for (let i in allIndexers){
       if (allIndexers[i]["name"].match(new RegExp(indexerNames[j], 'i'))){
        GM_setValue(indexerNames[j],allIndexers[i]["id"])
       }

     }

 }
}

function blackListHelper(allIndexers){
        indexerID = new Set(allIndexers.map((e)=>e["id"]))
        indexerNames=GM_config.get('indexers').split(",").map((e)=>e.trim())

        for (let j in indexerNames){
        cached=GM_getValue(indexerNames[j],"none")
        if (cached!="none"){
          indexerID.delete(cached)
        }

        }
      output=[]
      for (let i in allIndexers) {
       if (indexerID.has(allIndexers[i]["id"])) {
         output.push(allIndexers[i])
       }

      }
  return filterCurrSite(output)

}

function whiteListHelper(allIndexers){
        indexerID = []
        indexerNames=GM_config.get('indexers').split(",").map((e)=>e.trim())

        for (let j in indexerNames){
        cached=GM_getValue(indexerNames[j],"none")
        if (cached!="none"){
          indexerID.append(cached)
        }

        }
      output=[]
      for (let i in allIndexers) {
       if (indexerID.has(allIndexers[i]["id"])) {
         output.push(allIndexers[i])
       }

      }
  return filterCurrSite(output)
}

`
Events

These Functions Create Events to be used by script
`

function leftClickProcess(e){
    e.preventDefault()
  e.stopPropagation()
  if(e.button!=0){
    return
  }
  document.addEventListener("mousemove", mouseDragProcess)
  document.addEventListener("mouseup", mouseUpProcess)
}
function mouseUpProcess(e){
  e.preventDefault()
  e.stopPropagation()
  mouseClicksProcess()
    removeMouseEvents()

}

function mouseClicksProcess(){
  if (document.querySelector("#quicksearch").getAttribute('dragged')!='true'){
     toggleSearch()
  }
}
//Reset Mouse Events
function removeMouseEvents(){

  document.removeEventListener("mousemove", mouseDragProcess)
  document.removeEventListener("mouseup", mouseUpProcess)
      //reset for next time
  document.querySelector("#quicksearch").setAttribute(
    'dragged',null)
}

function mouseDragProcess(e){
    document.querySelector("#quicksearch").setAttribute('dragged','true')
    boxHeight=parseInt(getComputedStyle(document.querySelector("#quicksearch")).height.replaceAll( /[^0-9.]/g, ''));
    startMousePosition=parseInt(e.clientY)
    offsetMousePosition=startMousePosition+boxHeight
    viewport=100-((offsetMousePosition/window.innerHeight)*100)
    document.querySelector("#quicksearch").style.bottom=`${viewport}vh`

}

`
Functions For Menu Events

`
function openMenu(){
                content=document.querySelector("#searchcontent")

          content.style.pointerEvents="none"
    document.querySelector("#toggle").style.height='5%'
      document.querySelector("#toggle").style.width='5%'
      content.style.visibility = "hidden";
  document.querySelector("#toggle").removeEventListener("mousedown", leftClickProcess)
}

function closeMenu(){
      content=document.querySelector("#searchcontent")

      content.style.pointerEvents="all"
    document.querySelector("#toggle").style.height='2%'
      document.querySelector("#toggle").style.width='2%'
      content.style.visibility = "hidden";
  document.querySelector("#toggle").addEventListener("mousedown", leftClickProcess)
}

`
This is the main Function of the script
`
searchIcon="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAgAAAAIACAYAAAD0eNT6AAAAAXNSR0IArs4c6QAAIABJREFUeF7snQd4VFX6xt9zZyaFJCS0UAKKCtLSJgkWbIuiKBbWhm1VdNG1Yu8KdkVFBdfe1467IhYUUXEtrCWZJJMEpChIkd4DaTP3/J8zlr8FyEymnXvve54nj/tszjnf+/2+Q+abe8/5jgDgAhsJkAAJkAAJkICjCAgmAI6KN50lARIgARIggRABJgBcCCRAAiRAAiTgQAJMABwYdLpMAiRAAiRAAkwAuAZIgARIgARIwIEEmAA4MOh0mQRIgARIgASYAHANkAAJkAAJkIADCTABcGDQ6TIJkAAJkAAJMAHgGiABEiABEiABBxJgAuDAoNNlEiABEiABEmACwDVAAiRAAiRAAg4kwATAgUGnyyRAAiRAAiTABIBrgARIgARIgAQcSIAJgAODTpdJgARIgARIgAkA1wAJkAAJkAAJOJAAEwAHBp0ukwAJkAAJkAATAK4BEiABEiABEnAgASYADgw6XSYBEiABEiABJgBcAyRAAiRAAiTgQAJMABwYdLpMAiRAAiRAAkwAuAZIgARIgARIwIEEmAA4MOh0mQRIgARIgASYAHANkAAJkAAJkIADCTABcGDQ6TIJkAAJkAAJMAHgGiABEiABEiABBxJgAuDAoNNlEiABEiABEmACwDVAAiRAAiRAAg4kwATAgUGnyyRAAiRAAiTABIBrgARIgARIgAQcSIAJgAODTpdJgARIgARIgAkA1wAJkAAJkAAJOJAAEwAHBp0ukwAJkAAJkAATAK4BEiABEiABEnAgASYADgw6XSYBEiABEiABJgBcAyRAAiRAAiTgQAJMABwYdLpMAiRAAiRAAkwAuAZIgARIgARIwIEEmAA4MOh0mQRIgARIgASYAHANkAAJkAAJkIADCTABcGDQ6TIJkAAJkAAJMAHgGiABEiABEiABBxJgAuDAoNNlEiABEiABEmACwDVAAiRAAiRAAg4kwATAgUGnyyRAAiRAAiTABIBrgARIgARIgAQcSIAJgAODTpdJgARIgARIgAkA1wAJkAAJkAAJOJAAEwAHBp0ukwAJkAAJkAATAK4BEiABEiABEnAgASYADgw6XSYBEiABEiABJgBcAyRAAiRAAiTgQAJMABwYdLpMAiRAAiRAAkwAuAZIgARIgARIwIEEmAA4MOh0mQRIgARIgASYAHANkAAJkAAJkIADCTABcGDQ6TIJkAAJkAAJMAHgGiABEiABEiABBxJgAuDAoNNlEiABEiABEmACwDVAAiRAAiRAAg4kwATAgUGnyyRAAiRAAiTABIBrgARIgARIgAQcSIAJgAODTpdJgARIgARIgAkA1wAJkAAJkAAJOJAAEwAHBp0ukwAJkAAJkAATAK4BEiABEiABEnAgASYADgw6XSYBEiABEiABJgBcAyRAAiRAAiTgQAJMABwYdLpMAiRAAiRAAkwAuAZIgARIgARIwIEEmAA4MOh0mQRIgARIgASYAHANkAAJkAAJkIADCTABcGDQ6TIJkAAJkAAJMAHgGiABEiABEiABBxJgAuDAoNNlEiABEiABEmACwDVAAiRAAiRAAg4kwATAgUGnyyRAAiRAAiTABIBrgARIgARIgAQcSIAJgAODTpdJgARIgARIgAkA1wAJkAAJkAAJOJAAEwAHBp0ukwAJkAAJkAATAK4BEiABEiABEnAgASYADgw6XSYBEiABEiABJgBcAyRAAiRAAiTgQAJMABwYdLpsDwKzZq1Oz/Ysa5/aIbVdMBjMbgoGs9xIbQfIDNNsSfUYRruANA3DMLJ/8VgGZbqUIm17BISQjcIlGn75nWmam9zCMFtMc5theJoAsTWApm2pLtcWl8u1qWlD07ZNLT03Dx2a++sYe5ClFyTgDAJMAJwRZ3ppAQL+z/ztzSyzRwCuPBEM5rpcRhczgK5SmF1dhqeLlMGOQqKDFOgAoCMAjyZutQBYLyQ2SIENQrjWB82WNUIaqww3VgWD5hrpcq12I7jc2GL8WHhA4WZNdFMGCTiaABMAR4efzieKgJTSqKmp6dUiXb1dwZbeMNy9YQZ7S4hdAHQH0AtAeqL0JNmOemKwFMAKAbkEhmsxzMDioMuz2COCiwsKCpYKIcwka6R5ErA9ASYAtg8xHUwkgerq6u4t0hiYImVfU4h+0hR9IM09IbArAHcitVjYVgASPwiBBTDEAkDOD0DM9whzTlFR0QoL+0XpJKAVASYAWoWDYqxCYNasyqysDiLfMJEv4CoE5CAABUDo8Txb/AhsAFADiDqJoN80ULtlg6wdOtS7JX4mOTMJ2JMAEwB7xpVexZBAXV3dbk1NgTIhpRfCXSBh5oufHtmzaUJAAksFjFrIQI0UojI11V0+aNCgRZrIowwS0JIAEwAtw0JRySJQ+3VtlyZXYF9DiMGA+kEZgJxk6aHdqAhsBFAOyG9MKb9JDbr/l79X/pqoZuRgErARASYANgomXYmcQG1tbX4gYB5gSLF3EHIIJHaPfBaOsAwBge9dELNNIb9yu43P8vPzay2jnUJJIMYEmADEGCin05tAVVVVf8AYClP8RUL+BUAnvRVTXZwJrBMQn8CQnwDmrOLi4m/jbI/Tk4A2BJgAaBMKCokHgaqqqj1MEwcD4i8CQn3gd42HHc5pGwKrJFQyID8xDHxcXFz8nW08oyMk8AcCTAC4JGxFoG52XXZjasuhAA43hHEYgB62cpDOJJrAj6Y0PwDwflqTZ+agIYM2JVoA7ZFAvAgwAYgXWc6bMAJ+v784EDBHCBhHANgLgCthxmnISQSCAL6WMN/zeFzvFRQUVDrJefpqPwJMAOwXU9t7NGvWLE92p9yhCJjHCMijAeTZ3mk6qCOB5QLiHdNtTNu0bvWsoUOHqpLIbCRgGQJMACwTKmcL/fbzNe22pi8f4RbieBM4AhCZziZC7/UiIOsN4L2AlP/JaMib3n//Ltv00kc1JPBnAkwAuCq0JTBzZnlmx45u9Q3/eJcwDpfAdm+x09YBCnMkAQE0mjBmSBn49/r1gbcPPbSs3pEg6LT2BJgAaB8iZwlcunR2ytq12UdJGTjZgBjBD31nxd9u3qpkQArjPUC80rnzpnd69RrSbDcf6Y91CTABsG7sbKW8oqLuUI9hnhY05UgIZNnKOTpDAoqAxBaXIaa1mMZLpaWDZhIKCSSbABOAZEfAwfb9fv/AYFCcDilP43E9By8EZ7r+I6R42eWR/yosLJzjTAT0OtkEmAAkOwIOs+//zN/ezMJpUmI0JEod5j7dJYE/ExCoEALPGVvwUuEBhZuJiAQSRYAJQKJIO9zON5WVBximGGMI4zgA6VbF4TKCCJr2KDNAX7RbhQ2mNN8wUlqe8hYM/kw7dRRkOwJMAGwXUn0cmvvV3JwGT9NoAdc/ANlXH2VUQgK6ExALIMwn0ppTnh2w9wB1qyEbCcScABOAmCPlhNXV1WXBoHGBATmKu/i5Hkig7QR+OlIopkiX+WhpUdE3bZ+JI0lge2+fWDaV6yIGBKZPn+7O65Z3kinEWL7bjwFQTkECfyAgAJ+AnLR85fLXRowYESAgEoiWAJ8AREvQ4eNrv67t0uIKngchzuNNew5fDHQ/UQRWCcN43N2MR/P3yl+TKKO0Yz8CTADsF9OEeFRVVdVfmMZVJnAKgJSEGKUREiCB3xJoNoBX4JL3FRUVzSUaEoiUABOASIk5vH95Ve2BbimukDI4AoBaP2wkQALJJSCFcE0PCDmxrDj/0+RKoXUrEWACYKVoJVFrRUXNSEPI6wCUJVEGTZMACeycQLkpxV2lpQXTCIoEWiPABKA1Qg7+vZRS+Cv9p5oQ1wIY4GAUdJ0ErEZgrgF5d6G38GUhhLSaeOpNDAEmAInhbCkrUkqjpqrmrKCE+sbf21LiKZYESOC3BBa7BO4qKC54VghhEg0J/JYAEwCuh18JqG/8VVX+0wAxDhK7Ew0JkIBNCAh8D8hbi4sLX+ITAZvENAZuMAGIAUQ7TFHtqx5lSjEeAv3s4A99IAES2A4BiXmGkLcUlRRNIR8SYALg8DXg89X+VUjzZgjkOxwF3ScB5xCQqJXCuLmkJP9N5zhNT/9IgAmAQ9dERUXNEeqRoCHgdSgCuk0CjidgSlQCxvjS0vzpjofhQABMABwW9Irq6sEIyImGMIY4zHW6SwIksAMCwsCXQSEv430DzloiTAAcEu/a2tq85mbzbgGczAI+Dgk63SSByAhICbyakmJcm5+fvzyyoextRQJMAKwYtQg0T5/+ZUb37hlXQ8rLAaRHMJRdSYAEnEmgAULcv3Zt072HHlpW70wEzvCaCYBN4/zzkb5zAeMWSNnZpm7SLRIggXgREGItYI4vLi58gkcH4wU5ufMyAUgu/7hYr6ioO9RlmBOllAPjYoCTkgAJOIaAEGJO0DSuKC0dNNMxTjvEUSYANgp0dXX1LmYAkyHEUTZyi66QAAnoQEDKdww3xhYVFS3RQQ41RE+ACUD0DJM+w5Qp0tV3D/9VEOIGvudPejgogATsTKBBGMad8+cPumfUKBG0s6NO8I0JgMWj7PPPGSoCgYcB7GlxVyifBEjAOgTmS7f7wpLCgbOsI5lK/0iACYBF10T5p+W5RqbnAQFxkkVdoGwSIAGLE5CQr5n1LZeVHVi22uKuOFI+EwCLhf3n3f0XCRi3SCnbW0w+5ZIACdiNgMQWGHJccXHhP3lawFrBZQJgoXhVV1cXmUE8DYhiC8mmVBIgAQcQkNKs9qS4xhQUFFQ6wF1buMgEwAJhXLp0dsra1Vm3QshLAbgtIJkSSYAEnEkgACke7Jy7ZVyvXkOanYnAOl4zAdA8Vt9UVh7gMsWTQhh9NJdKeSRAAiQQIiCluTBoyHMGe72fEYm+BJgAaBqbGTOq0zp3FhMMgQtYu1/TIFEWCZDAzghIU+KRtWvlNcOHFzUSlX4EmADoFxNUVFcPMQLiWQjsoaE8SiIBEiCB8AlIfCc97rNLCgd+Ef4g9kwEASYAiaAcpo3Qu/61mXdCYiwAI8xh7EYCJEACuhMwITC5c+f667k3QJ9QMQHQJBZqh780jRdYv1+TgFAGCZBAzAmoewWEYZ5eVFRUHfPJOWHEBJgARIws9gN8vqqr1Ll+ACmxn50zkgAJkIBWBFokzHElJcX3aqXKgWKYACQx6L4vfD2RnvKCgHlAEmXQNAmQAAkknICE8Rkamk8v2a9kWcKN02CIABOAJC2Eal/tsSbMJwHkJEkCzZIACZBAsglsNKX5j9LS4v8kW4gT7TMBSHDU3367PLVnXuokQI5JsGmaIwESIAFNCYinli1vuuToo8uaNBVoS1lMABIY1urq6gFmUEwBMCCBZmmKBEiABKxAYK7hkqOKiormWkGsHTQyAUhQFP2V/tODEura3nYJMkkzDicgJbB1az22bduGpqYmBAIBtLS0hKg0NDTANM3Q/zYMA+np6aH/7fF44Ha7kZqainbt2iEjIxNC/ZVgI4HEENjmEriw0Fv4QmLMOdsKE4A4x1898u/Rw/2wIYzRcTbF6R1EYMuWLVi3bh3WrFmDDRs2YOPGTVi/fh22bt2K+vr60H/Vj1RZQBRNCIGMjIzQT2ZmZui/HTt2Qk5ONnJycpCbm4tOnTohKysrCiscSgK/J2BK87kffwxcyFcC8V0ZTADiyNfv9/cNtuB1COTH0QyntjGBzZs3Y/ny5aGflStXYsWKFaGfxka9KqumpaWhe/fuoZ+uXbuiZ8+eyMvLQ/v2vLHaxsszvq5J1Lo8OLGwsHBBfA05d3YmAHGKvc9X+1chTVXOl1+N4sTYbtOqR/TLli3Dd999h4ULF2Lx4sXYtGmTpd3Mzs5G79690adPH+yxxx6hxEC9YmAjgfAIyHoDrrOKSvKnhtefvSIhwAQgElph9q2srLkLUl7JS3zCBObQbup9/Pfff4958+dh4YKfPvBVEmDnpj78d911V/Tdsy/67dkPu+++e2jfARsJ7ISAhBD3eb0F15FSbAkwAYghT9+nvo7IdL8qgINjOC2nshEB9c5+7ty5qKurw7x589Dc7Owr01NSUtCvXz8MGjQIAwYMQJcuXWwUbboSSwIS+Bj1gZNLDixZH8t5nTwXE4AYRb+2tja/pdl8E0DvGE3JaWxCYMmSJfD5fKiqqsLq1att4lV83FCbCouLi1FSUoJddtklPkY4q4UJyB88Ka6R+fn5tRZ2QhvpTABiEIrKyrrjIIPPAsiIwXScwgYE1Lt8X6UP5d+UY+3atTbwKPEudO7cGWWDy1DiLQntHWAjgZ8JbDWleTarB0a/HpgARMnQV151szCMG/i+P0qQNhiujuN99dVX+PLLL/lNP8bxVE8G9ttvP+y99948WRBjthadTu0LuNPrLRhvUf1ayGYC0MYwzJhRnZab63oB0jy2jVNwmA0IqGI6NTU1+Oyzz0Lv9qM9d28DJHF1weVyoaCgAPvvvz/69+8fKmLE5mACwpi6enXw9OHDi/Q6F2uRkDABaEOgfJ/7uooM91uQKG3DcA6xAQFVbOfzzz8PffCrb/5siSfQsWPHUCKgflSRIjaHEhCokFsDx5TsX7LKoQTa7DYTgAjRVVdXF5lBMQ0AX0pGyM4O3dUu/lmzPsHs2V84fge/LvFUJwmGDNkPQ4f+hacIdAlK4nUsd7kxsrCwsCrxpq1rkQlABLGrqKg5whDyVW72iwCaTbqq8/offfRRaCc/H/PrGVRVtrioqAjDhg0L1RdgcxyBraYUJ5eWFrznOM/b6DATgDDBVfuqR5sQjwFgGbMwmdmh26JFi/D222/j22+/tYM7jvFB1RY45phjsNtuuznGZzoaIhAwIM8rKil6jjxaJ8AEoHVG8JVX3SAM42bu9A8Dlk26qLP777zzDmpredzYyiHNz8/HUUcd9aeaAuppQUpqClI8KaHSxGpzodpQqH7UEx61uVP9BIPB0I+6TdHpRZustA6kaY4vKSu+w0qak6GVCUAr1Csq/I8YAucmOjguI4ig6Uq02bjYs5Iv6sKdadOmwe/3b/dRv5V8aS2YTvFFfdgfcfjhOPa440KXFamLi1JT3RFfc6xuT25qagklA+qK5a319WiIw6VMTolLa+sz6t9LPOktLTw/6nlsPAETgB0EV13j2zPP8wogjrFx/OnazwTUrv7p09/Dp5/+N/TNj83aBNQ3ea/Xi4MPPhj77LMPunbtFBeHWlok1NXMGzdujMn1y3ER6ehJ5VvLlrecwmuFt78ImABsh8vcr+bmNHpa3gawr6P/7TjAefVh/8knn+Ddd99FQ0ODAzy2t4uqYJB69z9ixAjk5nZMqLMqGVBHQtetWwd10RObNgT+l9biOXrA3gM2aqNIEyFMAP4QiMr/VfYSKa73pEB/TWJEGXEioC7jmTJlClasWBEnC5w2UQTUlcNnnnkmhg4dimTfNiwlsGlTPdasXh2XVwSJYmorOxLz0Bw83Luvd6mt/IrSGSYAvwFYU1OzZ6BFfgigR5RcOVxjAupx/xtvvBEq2ctmbQLdunXDueeei2HDDoaORQE3bqyH2lfCDYRarLMf3R4xrKCgYL4WajQQwQTg5yCECvyYxgxI2VmDuFBCnAh88803eP3116GSADbrEvB4PDj99NNx2mmnITVV782yakvJ2rXrsWrVKtaQSPaSE2KtYZjDi4qKqpMtRQf7TAAAlFdV7euSxjuQyNYhKNQQewLr16/Hq6++ymN9sUeb8BkHDhyI66+/Hr17W6sYZ1NTEOqWyK1btyacGQ3+hoDApqAwjyorLv6f07k4PgGorJlzMFoCbwJo5/TFYFf/1bf+V155BY1xOLJlV2Y6+qWO86n3/KNHj076e/628lH7A1avXhe6LZIVJdtKMSbjtsHj/qu3YODHMZnNopM4OgGoqKg71BDBNwCkWzR+lL0TAmpX/2uvvYavv/6anCxOQF32M378eOy772CLe/KT/C1bGrB06VIEAgFb+GNFJwTQGJSuY0tLB820ov5YaHZsAlBRUTvCEOa/AaTEAiTn0IuAqt3/7LPPho5ksVmbQI8ePTBx4kT06tXd2o78Qb16JbD4h8VoamyylV8Wc6ZZwjixpCT/XYvpjolcRyYAFRU1Iw0hX+GHf0zWkFaTqEes77//XuhcPwv6aBWaNonZc889cf/99yMnx57X/aoHAIsXLw5VFmRLGgGVBJxaUpKvXgU7qjkuAaisrDsKMjiFH/72W+fqkf9zzz2Hmpoa+znnQI/UZj/1zT8ry95v6IJBlQT8wM2ByV3jLRLGKU5LAhyVAPz8zn8aP/yT+y8tHtaXL1+OJ554AmvWrInH9JwzwQT69u2LyZMn2/7D/xesKglYtIhPAhK8zP5orhnCfZLXO1BVgXVEc0wCUFFdd5ARDKrAcre/zZa22uX/0ksvsdiKTeLatWtXPP3007Z97L+jMKnXAd99/x33BCR3HTebUhxfWlrwXnJlJMa6IxKA0Dl/VeSHH/6JWVUJsqLe97/9zlt4/733E2SRZuJNICMjA4899hh2261XvE1pOb/aGLhw4cLQFcRsSSPQLN2uv5YUDvogaQoSZNj2CUB1dXWZaYoZLPKToBWVIDPqspUXX3wR6ts/mz0IqHP+d911F/bffx97ONRGLzZv3hbaGMiWVALbAiJ45GCv97OkqoizcVsnAFVVVYXSNFShh5w4c+T0CSSgyviq9/3qmxKbfQiccsopuPDCf9jHoSg8WblybahYEFvyCAghNgvDPKyoqKg8eSria9m2CYDf7x8YDOAjAF3ii5CzJ5KA2uT38MMP849jIqEnwFafPn3w5JNPwuNRf5LY1OuthQsX8YrqpC8Fud7lFn8pLCyck3QpcRBgywSgrq5ut+am4OcAusaBGadMEgG10/+hhx7C5s2bk6SAZuNBwDAMPP3UU+i75+7xmN6yczY2BrBgwQKWDE5+BFenpLr2GzRo0KLkS4mtAtslAL5PfR2RYcwWwugTW1ScLZkEfvjhh9CHPwumJDMK8bHNR/875spXAfFZc5HOKqW5EFvNISUHlqyPdKzO/W2VALz9dnlqr54pH0uJvXWGTm2REVDv+tVj/6YmlkyNjJz+vTt06BC6qCkzM01/sUlQqK4SnjdvAdSmV7bkEhACXy1d1nzw0UeX2eYPkW0SgClTpKtvnxpVz3lYcpcJrceSwNy5c/H444/zjH8soWo01xVXXIFjjz1aI0X6SVm/fnPoGmG25BMQMD6av3DQiFGjhC3OadomAaioqHreEMZpyV8iVBArAurD/5FHHuGZ6FgB1Wye3Nzc0G2N3Pi388CoDYHz5i1kEqzJ+jWl+VJpafGZmsiJSoYtEoCqqtrbpWleGxUJDtaKwHfffRd659/c3KyVLoqJHQF++w+fJZ8ChM8qET2FYdxdXJx/YyJsxdOG5RMAn6/qUgHjvnhC4tyJJaA2/E2aNAmNjY2JNUxrCSOQmZmJqVOnIj3dkzCbVjak9gJ8++18BFS9YDY9CAh5lddb9IAeYtqmwtIJgL/Sf3JQ4gUAPDzctvhrN0od9XvggQe421+7yMRW0LHHHosrrrgktpPafLYff1yNtWvX2txLS7knXQKnF3oLX7WU6t+ItWwC4PP79xIBfMKb/ay69P6sWxX5uffee6Eq/bHZm4Da2DloUD97Oxlj7xoaWkJ1Adi0ItAMjxjqLSj4SitVYYqxZALwc6Gf2azyF2aULdBNfejfd999rPAXRayEkOiQ40b3zm507eJGl44uZGcZaJ/hQlaWgcx2AilugbT0nx6YpaUYof82Nps//bdBojkgUb9NYssWE5u3BrFpi4k164NYtSaAFWsD2LAxACmje+DWs2dPvPLKixDRTRMFKesOXTD/ezTw1ZhuAVyTkuoaYsVCQZZLAGbOLM/s0jHlSynQX7dVQD1tI6BuPlMb/ubPn9+2CRw4ql2aQL/dU7BbrxTskufBbnke9OrhjvuO+pYWiWUrAli8rAWLl7dg0bIWzPuuCdsaZdhRGDNmDEaP/lvY/dnx/wmsWbMBK1asIBL9CMxfu655r0MPLbPU40tLJQBSSlFZWTNDAAfrF38qagsBdcTpX/96Hl99ZcknaG1xuU1jstsb8A5Mx8A+KRjQJwW79PDA+OkLfNKb2qC25McWzF3YjDkLm1E5pwGbNv/0VGF7TV33m5/P/L0tgVPlgZkot4Vc/MdI4OOFCwuOsFKNAEslAL4K/4NC4KL4h5IWEkXgrbffwvvvvZ8oc5axox7n99sjDXsVpKFkUBp239VjmUfmKqn7/ocW+Ooa8XVNI+Z91/jra4P09HS89957cLstEwrthM6dy8qA2gXlV0HiUW9JwcX66vu9MsskAP5K/9+DEo9bBSx1tk7A5/Phqaeear2jQ3qoD/3+u6fhgMHpGFKajk4dXLbwfN2GIGZXNODT8gZ06lqGCRPusIVfyXJiyZIfsXHjxmSZp93WCAh5oddbZInPKkskAD6ff38BfMAd/62tPOv8Xr3HnDBhAgv9AOjYwYXD98/E0P3S0a2zvb8am5mnolPPEdZZqBoqXbduE9RxWTZtCTQHRHD4YK/3M20V/ixM+wSgtrY2r6XZLOeOf92XUvj6GhoaQh/+q1evDn+QzXqqb/sl+ek4cmgmSvPTtHmfH2/MWb1ugjuDx/+i4Vxf34jvv/8+mik4Nv4E1nhSjLL8/HytMzWtE4BZs2Z5cnI6fQ6J0vjHixYSQUC9H37iicdRXV2dCHPa2fC4gUOGZOKYQzPRq7u9v+1vD35On8cg3JnaxcVKglQxwDlz5lhJsiO1CiG+mb8gf3+dNwVqnQBUVFQ9aQjjLEeuHps6/cEHH+DNN9+0qXc7divFAxw5NAvHHZ6FnPaabN9PcBSEkYqcPZ9OsFV7mqurm8dLsiwQWgnxWElJgbYb17VNAKp91eeaEI9YIMaUGCYBVeNfVfoz1bkxhzS12/2IgzJxwhFZ6Jhjj019bQ2dK6Un2u/j3VnkAAAgAElEQVR+d1uHc9xvCCxYsAjqVRqbBQgIOdrrLXpRR6VaJgAV1dWDjaD4Lzf96bhk2qapqakJd955J1S5X6e0/UrTMWZUNjp3ct6j/u3F2N2uEFm7XO2U8MfVz0WLlmLLli1xtcHJY0ZgmyfFGJKfn18bsxljNJF2CcDcr+bmNLqbfRBilxj5yGk0IPDiiy9i9mxVvdn+rc+uKfj7yTnI75tif2cj8DAlawgy8i6IYAS77ogAjwJabG1IfLd2fXOpbpUCtUsAqnz+dyRwuMXCS7k7IeCU8/7pqQJnHJeNIw/OtEzRnkQu3JT2ByGjxzmJNGlbW8uWrcT69ett6589HZNveUuKjtPJN60SgMqK6mshxO06AaKW6Ahs2rQJt912m+2v9x1cmIYLTsvh4/6dLJeUnMOQ0e2M6BYUR4cILF++CuvWrSMNqxEQ4nqvt+AeXWRrkwD8XOznIwDO3imly8qIkY4nnngCVVVVMZpNv2nUpTznndoBQ4e000+cZopSs4eiXfe/a6bKmnKYAFgzbgCCAREcpkuRIC0SgLrZddlNacEqAfSybFgp/E8E1Ae/SgDs2gb2ScVlYzrYvnpfrOKXkrUvMvIujNV0jp6HrwCsG34JLE1tdBUPGjJoU7K90CIB8PmqpwgIrd6NJDswVrevjiipR/92rFmuqvidclQORh2dCZfBS+3DXavujGJk9boy3O7stxMCP/ywHOr1Gps1CUjIN0pKikYlW33SEwB/pf/soIR9vyYmO8JJsv/KK6/gs8+0L4UdMZ3MdgJXntspVL6XLTICrvQ90X7XcZENYu/tEvj++yWor7fU1fOM5B8ICGmeV1xanNTb0JKaAPj9/r7BACoA8AWqjf55qDrlEydOhFR1f23Udt8lBdef3xFdu/Bcf1vCani6I3uPe9sylGP+QGDB/O/R0NhILtYmsM3tEWUFBQXzk+VG0hKA6dOnu7t3y/sSEMXJcp52Y09AfeZPmHA3lixZEvvJkzjjPsXpuPKcDkhNdWYZ35igN9zosOdzMZnK6ZPU1n7rqIqa9o23rFqxcvk+I0aMCCTDx6QlAJUV/nshcFkynKbN+BFQxX5U0R87tWOGZeLvo3Icc2NfPGOXvftkGCkd42nC9nO3tEjMnTvX9n46xkGBB73ewqRsjklKAlBRUXeoIYLTAXAHlY1WeWNjI8aNG2ebd5Nqs9+YkzpAJQBssSGQkXcVUrKKYjOZQ2fZsqUBixYtcqj3tnRbQriP8noHzki0dwlPAMpnlXdwZaeomshdE+0s7cWXwNSpUzFz5sz4GknQ7IYhcfGZnTBsP25PiSXy9M4nIq3zyFhO6bi5Vq9ej5UrVzrOb5s7vMpokIVF+xUltLpTwhOAal/1KybEiTYPpuPcU5f83Hrrrba4otTlErhyTCfsP5g7/WO9kF3pA9B+1xtiPa2j5quqqoVhcC+K3YIuIf9dUlJ0ciL9SmgCUO2rPdaE+Xq8HHQZQQRNexQStJovzz77LL755pvthtZKvqgP/+vO74S9i7f/4W8lX1r7d5YUXww3cvo8DWHE9t+pYQRh2uTf/s58CQaBG264Eaeeempr4dXi90lZY3HyPBG+GDBOLCrJnxonF/40bcISgJ8f/dcByE2Uc7STGALLli3DXXfdZfljf+qx/1XndOE3/zgvm8yeN8CTOSDOVuw5fU3NXFxwwQW49tpr0asXC6faMMprjAaZn6hXAQlLACora16GlEmvfGTDBZN0lx577DH4/f6k64hGgNrwN3Y03/lHwzDcsakdRqBdV2t8gw3Xp0T1e+SRJ/Dyyy+joKAA559/fqLM0k4CCSTyVUBCEoB4P/pPYGxo6g8Eli5dirvvvtvy3/7POiEHxx3O3f6JWOCGqz3a93mEVyZHCNs0geOPPxFqv41q6inALrvsEuEs7G4FAol6FRD3BICP/q2w3Nqu0Q7f/o86OAv/ODW77RA4MmICmXnXwJNVEPE4Jw/45ptKXHbZ/5dO4VMAW6+G1bI+kF9yYMn6eHoZ9wSgylfzooRM6M7GeALj3P9PwA7v/vf1puPa8zuxyE+CF3ZK1hBk5F2QYKvWNnf7HXfj/ffe/9UJIQSuu+469OzZ09qOUf12CSTiVUBcEwA++rf3yn7uuefw9ddfW9bJ3nke3Hd9F5b3TUIEheFB+90ehOHhk5dw8G/atBXHHXccmpqaftd9r732wujRo8OZgn0sSCDerwLilgDMmlWZlZPjmQNpdrcgd0puhcDatWtx8803W7YeeUa6wAM3dkP3rrE9jsaFEz4BbgYMn9XTTz8PddT2j03VAxg/fjy6dOkS/mTsaSUCq1xbMaDwgMLN8RAdtwSgylfzsIT8RzxEc87kE/j3v/+Njz/+OPlC2qBA7fi/8aIu2KuIhX7agC9mQ4SRCnU3gHBnxGxOO05UX9+IUaNGYfPm7X8GHHzwwTjhhBPs6Dp9AmBKPFFaWhiX92VxSQAqa2r2Rov8nLX+7bl+GxoacP311//pcaRVvD1xRHuccVx7q8i1tc60jiORnsvCoDsL8jPP/AvPPPPMDrukpqbizjvvRHp6uq3XioOdkwERPGCw1/tlrBnEPAGQUhpVvhofBPJjLZbz6UFg1qxZeP31uBV0jKuTfXdLwT3XdIHbzXuo4go6zMl/2gvwAAxPTpgjnNVN1f1XVf/URVs7ayeeeCKGDh3qLDgO8lYIMWf+gnzvqFEiGEu3Y54A+HxVVwkYd8VSJOfSh4CUwK233oJVq1bpIypMJampAg+N43v/MHElrJsnay9k5o1NmD0rGRo//jZ89NFHrUru2rUrxo0bz9oKrZKybgcJ87qSkuJ7Y+lBTBOAmpqaHoEWcw4gWFElllHSaK4FCxbggQce0EhR+FIuOqMDhh/I983hE0tcz8wel8PTviRxBi1gafbsr3H11VeHrfTSSy/FnnvuGXZ/drQcgW2eFGNAfn7+8lgpj2kC4PNVvyoguBslVtHRcJ6dXfqjodxfJRUNSMVtl3fhNyRNgyTcOcjufQ+Em9cvqxBt3rwNZ5xxBtRpm3Db4MGDcdZZZ4Xbnf0sSEBCvlFSUhSzkvoxSwDKq2oOcZlyhgWZUnKYBLZt2xYqPxoIBMIcoUe3FA/w8C3d0S2XR/70iMj2VXgyS5HZ8/8r3emsNZ7a1Gu2m266BZ98MisiM263O1SWu107JlERgbNYZ1Mah5eW5n8YC9kxSQBCG/8qa2oB8PlTLKKi6RyffvopXn31VU3V7VgW6/xbJ2RpXU5GeqejrCM4DkqnTHkDkydPbtPMJ510Eg466KA2jeUgqxAQCxYszM+PxYbAmCQAlZXVF0MKa74YtkrMNdB57733YtGiRRooCV9Crx4ePDQ+Fy4Xd/2HTy2ZPQ1k5l0NT5YzDxGp9/7qKZupbv5pQ9ttt91w1VVXtWEkh1iJgIR5RUlJ8aRoNUedAMz9am5Oo6dlAYAO0YrheH0JqHeR48aN01fgDpTdeVUuCvqlWE63kwWrAkFZvcbDle6sm+7mzl2Aiy++uNUjf62tjVtvvRWdO3durRt/b20CG9NaPH0G7D1gYzRuRJ0AVFXVPCBNeXE0IjhWfwIzZ87E1KlT9Rf6G4X7FKfjhos6WUozxf5EwHBlI3OXm+BK7eYIJIsWLcWFF164w2p/kUA49thjceihh0YyhH0tSEBK/LOktPDSaKRHlQD4/f6+wQD8ADzRiOBY/QlMmDABP/zwg/5Cf1ZoGBKP3NIded3dltFMob8nINwdkdnzWrjTetgazeLFy0LX/K5ZsyYmfu6yyy6h1whsticQcLlRUFhYqJ7At6lFlQD4fDVTBeTRbbLMQZYhoP4wqQtHrNQO3S8DY8/iWykrxWx7WoWRgcyeV8Hdro/VXdmu/pqaubjmmmti8s3/twZuueUWXhBkyxXzhyRZuN4t9g4a2VZX25wA+PxzhopAYGZbDXOcdQjMmDED06ZNs4xglyHw2J1d0a0zv/1bJmg7EarKBWd0GwtPe68d3PnVhy+++Cq0r+aPV/zGwsmRI0di+PDhsZiKc+hOwOM+zFswsE03s7U5Aaj0+X0ACnVnQ33RE7Da4//D/5KJC//G2vLRR16nGQTSO5+AtM5t/rKjjTPqnP+LL76CJ598ss27/VtzZtdddw09WWBzAAGJWm9pYXFbPG1TAuCv9J8dlHiiLQY5xloENm3aFLr5T6q/WhZo6qrfJ+7owaI/FohVWyS6M4qR0e0fMDxZbRme9DEbNmzBXXfdhdmzZ8dVixAidENgdnZ2XO1wcj0IuAT+UegtfDpSNREnADNmVKfldhHfAegaqTH2tx4B9YfqxRdftIzwA/duh6vO6WgZvRQaOQHDlYX0Ln9DSs5+kQ9O4oiPPvovHnzwQWzYsCEhKv72t79hyJAhCbFFI0knsDp9W/c+/ffvsi0SJREnALztLxK81u/71FNPwedTb3us0e6/Phd9d+e5f2tEKzqVrvT+aNf1bO1PCSxbthKTJk3C//73v+gcjnC01+vFOeecE+EodrcqAWma40vKiu+IRH9ECcDMmeWZnTt5vgcEv2JFQtmifVU1MnUbmboDwAqtf59U3HttFytIpcZYETAMpGYfhtROI+Fy6/VaYP36zXjppZfwxhtvoKWlJVYehz1Peno6VPVOwzDCHsOO1iUghNgc2Ni0R9nQsrAfMUWUAFRV1Y6XpnmTdRFReSQE1Ll/tQHQKu3KMZ1w0D7pVpFLnTEkIIwUpGQfgrQOR8BISe73kxUr1uD1118PnZyJxw7/SLCpBL53796RDGFfCxMQMO4vLskP+w7psBOA8lnlHdw5qd9JKdtbmA+lR0Dgww8/DH17sULLbCfw/MQeSPGw5r8V4hU/jQKezBKktv8L3FnehF3/3NIi8fXXX+Ott94KPepvay3/WHNhVcBYE9V7PgE0CpfsW1RUtCIcpWEnAJWVNXdBSt4yEQ5Vm/R54oknUFVVZQlvjhmWiXNO5tE/SwQrQSJVEaGUrMHwZHjhysiH4UqNqeWtW5tQUVER2tH/ySefoL6+Pqbzx2Ky/Px8XHDBBbGYinNYhICEeKykpOCicOSGlQCUf1qe68pMUTv/+Xw1HKo26KNO/V1zzdVa/lHbHt6HxndF716sSG2DpRcnFwwYab3hSe8HV+qucKf2gkjJheEK70+aGWyEbF6DYNMSrF69COMnfIYFCxZo801/R9BSU1MxceJE7gOI06rSdNpmNAX7eff1Lm1NX1gJgK/C/6AQCCujaM0gf28NAqtXr8bNN99sCbF53dx47HZnXBpjiYBYSKS6eVC4O0G4siCM/08GpNkImA1Q/5XBTaH//rZdcOMqLF2Z+I19bUF7ww03IC8vry1DOcaqBCSe9JYWnt+a/FYTAN8Xvp4i3T0fAM9WtUbTRr9X7zFfeOEFS3h0yjHZOPUYvXaAWwIcRbaZwCtvb8HL0za1eXwiB5522mnYbz9r1UxIJB+b2moxXLJfUVHRkp3512oCUFnhfxQCPExq01WyI7fU8aUvvvjCEl4/fGs37NKDdf8tESybiFzyYwAXjltpCW9UMSBVFIjNWQQk5NMlJUX/aHMC4Pvc11W0cy/it39nLRzlrSojumzZMu0d36W7Bw/fxqKU2gfKhgIvvGkVlqzQ/zWAevyvXgOwOY5AsyfF6Jufn798R57v9AlAla96goS4wnHYHO6wKlqi7ifX5SjTzsLx18Oy8PdRrHfu8CWbFPefmbIJUz/YkhTbkRhVhYAeeOABeDzcJBsJN1v0leIRb2nB2IgTgLrZddnNaYEfAJFpCxB0ImwCS5cuDV1YYoV22xVdUDwgtse7rOA3NSafQNXcJtw0cU3yhYSh4LrrrkOvXr3C6MkuNiPQEKxv3qPswLLV2/Nrh08AfOVVNwjDuMVmMOhOGAS++uorPP/882H0TG6XFA/w6uQ8eFj8J7mBcKj1loDEyRcvR7P+bwFwxhlnYJ999nFopBzuthT3eUsLrg07AQjd+JdrLIaUnR2OzpHuv/nmm/jggw+09700Pw03X8olqn2gbCzw5gfXoqL290cEdXT30EMPhaoKyOZEArJ+4yaz19Ch3j+9r9ruE4DKyuqLIMWDTkRFn4FHHnkEtbW12qM4/a/ZGHUUj/9pHygbC5zyzha88Kb+xwFZEdDGizAc14S8west+tPFLn9KAKZMka6+e/gXQIhdwpmXfexHYPz48VizRv93m3dclYvCfixPYb8VaB2PauY14/p7t/t6VSsnOnfujFtvvVUrTRSTQALCWLFx45rdhw4d+rsXVn9KAPxV/jOCJp5JoDSa0ohAMBjEJZdcov0JAMOQeO2hPKSl8qpTjZaP46Q0Npk4+eIVCJpSa9/VSYBJkybB5XJprZPi4kfAJXBuobfwd5/tf0oAqipr/FLKgfGTwZl1JqC++asnALq33XdJwaRxubrLpD4HELj0ttX47odm7T1Vpb1zc/lvRvtAxU/gfG9J4e8+23+XAFRU1A4zhPl+/OxzZt0JfPvtt5g8ebLuMjH8gExcdCZv/9M+UA4Q+M/nN2LGZ/rdBPhH9GPHjkX//v0dEBG6uEMCwvVXr3fQO7/8/ncJgM/nf0sAI4jPuQTU1aYvvvii9gD+cUoOjjqEJSq0D5QDBL7zUT0ef2Wj9p7yTgDtQxR3gdI0Z5aUFR/xpwSgrq5ut+am4DwAfKka9zDoa2D69Ol4551fE0Rthd5+ZRcU9WcBIG0D5CBh1d824cb79N80e+SRR0L9sDmagJQI5JeUlKjPevz6BKCyomYihLzE0WjoPF5++WV8/vnn2pN47t7u6NSBG5q0D5QDBK7bEMToq1Zo7+n++++PU089VXudFBhnAr+5KjiUAMyatTo9J3vlUgB8qRpn9rpP//jjj6O6ulprmaqk+X8e6QmhVi8bCSSZgJTACRcs074iYGFhIc4777wk06J5DQg0BDc171I2tGxDKAHwV/rPC0r8UwNhlJBkAvfeey8WLVIXQOrbdu3hwT9v5Q2A+kbIecouHr8Ki5frXRN4t912w1VXXeW84NDjPxMQ8iqvt+iBUALAo39cIb8QGDduHNauXas1kLKCNIy/hCWAtQ6Sw8TdMmktymv0LgnMYkAOW5Q7c1fge6+3cE9RXlVzmMuUM4iGBBSBK6+8Etu2bdMaxuEHZuLCM/i2SusgOUzcoy9sxPT/6n0UsF27drjvvvscFhm6u0MCwn2kqK6sftOUYqQdMLmMIIKmPTaGJcuXCy+8EFK91Ixhi7UvJ45ojzOOax9DheFPFWtfwrcc+570JXZMX5i6GVPe3RyTCeMZl4cffiShe2fi6UtMYEcwid18MWXKu8Lnq31TwLRFAhBBLNl1OwQaGhpwxRVXaM9mzEk5GHkoawBoHygHCZw2sx5PvaZ/LYCJEyciPT3dQZGhqzsiIITrXVFRUTuc1f+4SBSB+vp6XH311drDuPTsjjhkSDvtdVKgcwh8NHsbHnxmvfYOT5gwAVlZvEFT+0AlQqB6BcBNgIkgbQ0bGzZswA033KC92HFjO2NwYZr2OinQOQS+8Tfi1sl6b55V0bjjjjvQoUMH5wSGnm6fwC+bAEMJQJX/fGniIbJyNoH169fjxhtv1B7CbZd3QfFAVgHUPlAOElg1pwk33a9/NcDbbrsNnTp1clBk6Op2CQh5tddbdD8LAXF9/Ergxx9/xO233649kXuu64oBe3i010mBziEw97sWXH3XKu0dVgl+jx49tNdJgXEl8PtCQMpUla/mfgk5Nq5mObnWBJgAaB0eitOYABMAjYNDab8n8MdSwOq3vAyIq2Tx4sW45557tAfx0M3d0LunW3udFOgcAj8sD+Ci8Su1d1ht8u3du7f2OikwbgS2fxmQMlfpq30bMH+9KjBuEjixlgSWLFmCu+++W0ttvxX10Piu6N2LrwC0D5SDBC5e2oKLb9H/FcA111yDXXfd1UGRoau/JSCE+KTYWzDsl//v19sA1f9RUVE7jEcCnbtg+ArAubGn59ER4CuA6PhxdIIICNdfvd5Bv973/rsE4KenAP4aAAMSJIdmNCKwYsUKqF3CujduAtQ9Qs7TxwTAeTG3nsdigbek4Hef7X9KAPxV/jOCJp6xnnNUHC0Bq9QBuOWyLigZxGOA0cab42NHwFfXhPEP6H8MkHUAYhdzq83kEji30Fv4u8/2PyUAU6ZIV58+NQsF0MtqDlJvdASskgDceFFn7F3MQkDRRZujY0ngq6pG3P5PFgKKJVPOFUMCwljRufPmPXr1GtL821n/lACEXgNUVl8MKR6IoXlOZQEC6hZAdRug7u2Sszpi2H4sBax7nJykb+bn2zD5Of1LAd97773IyMhwUmjoqyIg5Y3e0qI/7fDebgIwa9bq9JycVYsgJS9dd9DyaW5uxqWXXqq9x2efmI1jh7OeufaBcpDAqTO24JnXN2nv8YMPPoiUlBTtdVJgLAnI+o2bzF5Dh3q3/HHW7SYAqpOvvOoGYRi3xFIG59KfwNixYxEIBLQWevwRWRh9fLbWGinOWQSe+88m/Oe9P/191QqC2+3G5MmTtdJEMfEnICAnFpcUXbM9SztMAOpm12U3pwV+AATvXY1/jLSxcP3112PjRr2vNT30gEyMPTNHG2YUQgKTn9+ImZ/Vaw0iOzsbd911l9YaKS7mBBqC9c17lB1YtjqiBEB1rvLV3iNhXh5zSZxQWwJ33nknli1bpq0+JUxdBKQuBGIjAV0IjLt/DSrnNOkiZ7s6evbsCZXgszmIgBSPeEsLdljif4dPAEIJwOyqbjLN+B4AXxo5ZM2oR4Tffvut1t52z3XjiTu7aa2R4pxF4B83rMSPq/R+dda/f3+oV3xsjiHQLBsCe5bsV7LDb3Q7TQAUpsoK/6MQOMcxyBzu6FNPPQWfz6c1BZdL4D+P9oDLUMuXjQSSSyBoShx//o8IBmVyhbRivaSkBGPGjNFaI8XFjoCAeKa4pODcnc3YagLg+8LXU6S75/MpQOwCo/NMU6a8jk8+maWzxJC2J+/sjm65Lu11UqD9CaxaE8CY6/S/COiggw7CSSedZP+A0ENFoMXlRv/CwsIfokoA1OCKCv8kQ+BCcrU/gRkzZmDatGnaOzr+ks4oK2AxIO0D5QCB5TWNuGWS/kWARo4cieHDhzsgInQRv7nyN+oEoPzT8lxXZsp3ANKJ1t4Evv76azz33HPaO3nWCTk47nAeUNE+UA4Q+Mb79Xj233qfnFFhGD16NPbaay8HRMTxLjajKdjPu693aWskWn0F8MsElRU1d0NI/cvEteYxf79TAgsXLsT999+vPaUD926Hq87pqL1OCrQ/gfueXI//frVNe0cvv/xy9OnTR3udFBgdAQHxeHFJQVhP7MNOAMpnlXdwtU/5HgIswRZdfLQevX79etx4441aa1Ti8rq58djtPAmgfaAcIPC8G1di+Uq9TwCoMNx+++3o2JFJs52XpAAaXR6xZ0FBwY/h+Bl2AqAmq6qqHS9N86ZwJmYfaxKQErjkEv2rAQoh8eL9eWifZVgTNFXbgsCWehOnXbYcUup9IsXlcmHy5Icg9JZpizWRTCcEjPuLS/KvDldDRAnAzJnlmZ07pSwC0CFcA+xnPQK33XYbVqxYob3wcWM7Y3AhNwJqHygbC/zG34hbJ+u/AbB79+646SZ+d7PxUoQQYnNgY9MeZUPLNoTrZ0QJgJq0srLmakh5Z7gG2M96BJ588klUVlZqL/zEEe1xxnHttddJgfYl8K83NuP16Zu1d9Dr9eKcc1jORftARSFQmub4krLiOyKZIuIEYMaM6rTcLkKdCOgaiSH2tQ6Bd955B9OnT9de8MA+qZhwLUsCax8oGwu8dsIa1C3QuwSwwj9ixAgcddRRNo6E411bnb6te5/++3eJaDdqxAmAwuyv9J8dlHjC8chtCqCiogJPP/209t4ZhsQrk3qiXTpfbGofLBsK3NYgceolP0JVAtS9/f3vf0dpaanuMqmvjQSENM8rLi1+KtLhbUoAlBFfhb9SCBREapD99SewcuVK3HrrrfoLBXDd+Z0wpJTlKSwRLJuJnF3RgLseXWcJr9T7f7UPgM2GBCRqvaWFxW3xrO0JgH/OUBEIzGyLUY7Rm4BpmrjsssvQ0tKit1AAhx2YiYvP4NXA2gfKhgIf/tdGvP+p3lcAK+wejwcPPPAADIMnZmy4DBE0xPCy4oKP2uJbmxMAZayyovpNCMEXS20hr/mY++67D99/ry6C1Lt17ODCc/d05/EmvcNkO3XquOzoq1dg/Yag9r7tvvvuuPJK1nDTPlBtECiB6SUlhce0YWhoSFQJgN/v7xsMoAaAu60COE5PAv/+97/x8ccf6ynuD6ruua4rBuzhsYRWirQHgbnfteDqu1ZZwpmhQ4fixBNPtIRWioyIQMDtEYUFBQXqsr42tagSAGWxqqrmAWnKi9tknYO0JaCuBFZXA1uhjRyWiTEn8zWAFWJlF41PvboR0z7U//G/4n3WWWdh8ODBdkFPP34mICX+WVJaeGk0QKJOAOZ+NTen0dOygMWBogmDfmM3btyI66+/Xj9h21HUMdvAc/f14GsAS0TL+iJDj/+v/BHrN5mWcOaWW25Bly48LmuJYIUvcmNwU3PfSIr+bG/qqBOAn54C+MdKE/rfIBM+XPYEQpXD1q2zxi7nO67sgsL+qYwbCcSdgH9eM264d3Xc7cTCQPv27XH33XfHYirOoREBCfOKkpLiSdFKikkCIKU0qipr6wDZN1pBHK8Pgeeffx5fffWVPoJ2ouQv+2TgijGsUG2JYFlc5MSnNuCTL7dawgt19l/VAGCzEwGxYMXKpQUjRoyI+gaqmCQACm15Vc0hLlPOsBNmp/vy2Wef4ZVXXrEEBo8beH5iD2Rl8KiTJQJmUZFbtpo484of0RL1n97EADjppJNw0EEHJcYYrSSEgCldRws02s4AACAASURBVJSWDorJEfyYJQDKc5+v+lUBcUJCKNBI3AlYqSCQgnHuKTk4+pDMuHOhAecSePujejzxykbLAGABIMuEKjyhwpjq9ebH7EhHTBOA2travJbmYB0g+Fc4vHBq3+uGG27Ahg1hXy6VVH/yurnx6G3duBkwqVGwr3G1+e+icauwZIX+BbJUFDp06IA77ojobhj7Bs8enm3zpBgD8vPzl8fKnZgmAD89Bai6SsC4K1YCOU9yCbz00kv44osvkisiAus3je2MvXhFcATE2DVcAl/7G3GbBa7+/cWfIUOG4G9/+1u47rGf7gSEuN7rLbgnljJjngCENgT6anwQyI+lUM6VHALqWmB1PbBVWmH/NNxxZWeryKVOCxG48b61qP620TKKzz77bJSVlVlGL4XumIAQYs78BfneUaNETEtPxjwBUC58U1m5j1u6Pvu50iDjamECDQ0NuPrqqxEMxnTdxZXI/dfnou/uKXG1wcmdRWDB9824/E5rHP1TkXG5XJgwYQLatWvnrEDZ01tpuuRBpUVFs2PtXlwSACWyylfzsIT8R6wFc77EE5g0aRLmzZuXeMNttLhXUTpuurhTG0dzGAn8mcAd/1yHL6saLIOmX79+uOSSSyyjl0J3QkDiSW9p4fnxYBS3BGDWrMqsDtnGXAnRLR7COWfiCFjpOOAvVPgUIHHrw+6WrPbtX8Xj5JNPxoEHHmj30DjBv1WurRhQeEDh5ng4G7cEQImt9tUea8J8PR7COWfiCGzZsgXXXXcd1DXBVmneQWm49TLuBbBKvHTWOf6BtfDVWefdv7r2984774SqAshmbQIGjBOLSvKnxsuLuCYAPyUB1a+YEDE7txgvEJx35wQmT56Mb7/91lKY7romF/l9uRfAUkHTTGztgmZcN8E67/4Vvv79+2Ps2LGakaScSAlIyH+XlBSdHOm4SPrHPQEon1XewZWdUgcgNxJh7KsXAXUUUB0JtFLru1sKJl6fy7oAVgqaRlrVuf8r7lyNBYuaNVLVupTTTjsN++23X+sd2UNfAkKsNbaZg4r2K4rrZSxxTwB+egrAVwH6rrTwlNXX1+Paa6+11GsA5dkVf++Ev+ybHp6T7EUCvyHwyf8aMPHpuP79jTlv9fhfXf6TmclabDGHm8AJ4/3o/xdXEpIAKGMsE5zA1RMnUw8//DDq6tTDHOs0dVXwo7d3R7t0tdTZSCA8Ag2NEufdsMIyV/7+4tXAgQNx0UUXhecke2lJIBGP/hOeACTiVYDLCCJourQMaqSidPSlvLwczzzzTKSuINm+HDk0C+edlh2x7u0NSLYvMXHi50noy45pPv7yJrzz8ZZY4g57rmjiolvxn2h8CRtYgjomxJcEPfpPeAKgDPJVQIJWapzMtLS0hE4DbNu2LU4W4jOtEBJ3X5OLgX1S42OAs9qKwNzvWnDN3SshpbWeGqWnp4ce/3s8HlvFw1HOCNcor3fQG4nyOWGvAH5xiK8CEhXa+NiZMuV1fPLJrPhMHsdZe3XzYNL4XHg81vqjHkcknHo7BFoCEpfestoyF/781oW//GUoRo3igSurLuxEPvpPyhOA0FOAL6o7menCD6CrVQPlZN3Lly+37A1jJxzRHmcez7PRTl6/rfn+rzc24/Xpcam50prpqH+vbu7My8uLeh5OkBQCq4wGWRjvXf9/9CzhTwCUAJ+/7jARCL7LuwKSstCiNnr//fdj4cKFUc+T6AnUq4A7r+qK/D1ZGyDR7K1gr3Z+M66/d5XlHv0rtnvssQeuuOIKK2Cmxj8TkBDuo7zegTMSDScpCYBysrLSfx8kLk20w7QXPYFvvvkGzz77bPQTJWGGLh1dmDy+KzIzjCRYp0ldCWzdJnHxzSuxZr11Lr36LcuzzjoLgwcP1hUvde2EgICYXFxScHkyICUtAZg+fbq7e7e8LwFRnAzHabPtBNTNgDfeeCM2bdrU9kmSOHL/0na4+ryOLBCUxBjoZFoV/LnnsfX4vMJam1t/YZidnY3bb789dAMgm7UISGlWr1z1494jRowIJEN50hIA5azf7+8bDKACAO+sTEb0o7A5Y8YMTJs2LYoZkjt0zKgOGHlYRnJF0LoWBKZ9sBVPTdmghZa2iBg5ciSGDx/elqEck1wC29weUVZQUDA/WTKSmgAop6sqqsZIYTyWLAC02zYCW7duDT0FaGpqatsESR5lGBJ3XMn9AEkOQ9LN18xrxo0TV8E0rXk6JCUlJfTtn5X/kr6UIhYgpHlecWnxUxEPjOGApCcAyhefr3qKgDguhn5xqgQQeOONN/Dhhx8mwFJ8TGS3NzDppq7o1IGPTuNDWO9Z120I4pLbVmHTZuvccvlHoocccgiOP/54vUFT3Z8ImNJ8s7S0+IRko9EiAaibXZfdnBasBtAz2UBoP3wCGzZswLhx46D2BFi17dbTEyoSxFLBVo1g23SrUr/X3L0ai5a1tG0CDUapd/633norOnTooIEaSoiAwLKURlfRoCGDkr6JSosEQIH7prLyALd0qa+T/DoWwUpKdtdXXnkFn332WbJlRGV/X286rj2/EwweDIiKo1UGmyZw96Pr8L/KBqtI3q7OAw44AKeccoqlfXCg+GBABIcN9nq1+KOpTQKgFkJVVe110jRvc+CisKzL69atw80332zppwAK/sFDMnDpWR14MsCyKzE84WrH/+TnN+DDz7eGN0DTXurWv1tuuQWdOnXSVCFlbZeAkDd4vUUTdKGjVQIQSgJ8/nckcLgugKijdQJ2eAqgvPzrYVn4+6jYXBrUOjX2SAaBp6dswpsfJOeSn1j6u//+++PUU0+N5ZScK84EJMTbJSUFx8bZTETTa5cAhG4NbO+pgBC7ROQJOyeNgNoLoJ4CqMuCrN5OPro9ThvJcsFWj+P29L80bTNefduaZX5/64/b7Q79e+vYsaMdw2RPnyS+W7u+ufTQQ8vqdXJQuwRAwfH5/XuJAD4BwJqtOq2WnWiZOnUqZs6caRG1O5d5+nHZGDUiyxa+0ImfCLz+7hb8a2rS91zFJBzc+R8TjImcZBtEcD+v11uTSKPh2NIyAVDCKyur/wEpHg7HCfZJPoH6+nqMHz8eDQ3W3lj1C8lRR7bH6cfySUDyV1b0Cl6YuhlT3rX+N39FQl35q97989x/9OsiYTMIOdrrLXoxYfYiMKRtAqB8qKioesoQxugI/GHXJBL473//i9deey2JCmJreuSwTPz9pBxuDIwt1oTNpjb8Pf3aRkz7UKunrlH5f+KJJ2Lo0KFRzcHBiSMgIB4vLim4MHEWI7OkdQKwdOnslLVrMz+DRGlkbrF3MgioegB33HEHVq5cmQzzcbF5yH4ZuOj0HLjd1qwUFxcoFpg0EJB4+MWNlt/t/1vU3bp1g7rylzX/LbAAf5JYvmBhwX6jRgltC6VonQAogr4vfD1FuvsbAF0sE3YHC507dy4eeughWxEoGpCK687vjIx2TAKsEFh1s9/dj61F1RxrlqneEeOLLroIAwcOtEIIqBFY40kxyvLz85frDEP7BEDB+7lIkLormZsCdV5NP2t79NFHUVOj3X6XqMjt2sODcWM7IbezO6p5ODi+BFavDeC2h9Zh8XLrn0j5Lan8/HxccMEF8YXH2WNFoCVoGMPLivM/jdWE8ZrHEgmAcp6XBsVrCcR+3tWrV4deBdjhWOBv6bTPMHD1+Z1Q1D819tA4Y9QEqr9twj2PrsPmrdat7b89COrYn7p4Kzc3N2pGnCD+BISBi4uLCx+Nv6XoLVgmAVCuVlT4JxkC2m6oiD4c9pnB6tcF7ygS6hbBM47tgOMOz+TmQE2Wq9rs98b79fjX1A2WvdVvZyh53a8mCy0MGRLisZKSgovC6KpFF0slAFJKo7Ky5n0BHKwFPYrYIQG1IXDChAlYtmyZLSntU5yOi8/sgPZZvEAgmQHevMXEQ89vwJdV9jh++keWeXl5uPbaa7nxL5mLLEzbEvh44cKCI3Te9PdHVyyVACjxM2eWZ3bulPI1gD3DjAu7JYnAkiVLcM8998BUt6/YsHXMNnDZmE4oHsBXAskIb9XcJjz49Hqs26jtJuuosKh6/1dddRV23XXXqObh4PgTkNJcuG59oEy3Sn+teW65BEA5VFdXt1tzU3A2Twa0Ft7k//6NN97Ahx+qSx7t2YSQGHloe/ztr9lI5RbVhAS5qRl48c1NmDZzM6S078mMYcOG4bjjjksIUxqJisCalFTXkEGDBi2KapYkDLZkAqA4VdbU7I0WOYsnA5KwaiIw2dTUhLvuugtqY6CdW/cublx4ZgduEIxzkNVGv4ef34AVawJxtpTc6bt06YLrr78eqal8upTcSLRqvTlomIeUFRf/r9WeGnawbAKgWPor/ScHJV4AYN+vARoumkgl/fDDD7j33ntt+yrgFx7qacAh+2Xi7BOykZXJvQGRrpOd9d9Sb+LZ/2zGh59vsfW3fsWAj/5juXLiOpd0CZxe6C18Na5W4ji5pROA0JOAytorIE1t7leOY6wsPfX777+Pt956y9I+hCs+s53AyUdn46iDM+ByMTcNl9v2+gVNiXc+2opX396E+m0ymqksM/boo4/GEUccYRm9ThUqDFxbXFx4n5X9t3wCoOBXVdXeLk3zWisHwu7a1UbASZMmYcGCBXZ39Vf/VPGgs0/KQckgPsZtS9B9dU145rWN+OFHexX12RmLvn374pJLLgk9BWDTl4AwjLuLi/Nv1FdheMpskQAoVysqqp43hHFaeG6zVzIIrF+/PlQgyC43BobLcFDfVJz612wU9uMuwXCY+ec14+U3N6Fugb1K+bbme1paWqjgT8eOHVvryt8nkYApzZdKS4vPTKKEmJm2TQIwZYp09elT8x5rBMRsbcRlIp/Ph6effhpSVW9xWCvsn4aTjspCISsJbjfy/m+bMOWdLaj+ttFhK+Mnd8eMGYOSkhJH+m4Vp6141n9nbG2TACgnZ8yoTuuaKz6SEntbZUE5UefUqVMxc+ZMJ7oe8nmPXVNw3GFZ2K8szfF7BIJBiS/KG/HGB1vw3Q/Njl0T6opfddUvm74EhMBXGzZ2GzZ0aK5tqk7ZKgFQS8f3qa8jMozZQhh99F1Kzlam9gOoGwPnzZvnaBBdOrpw2IGZGDakHTp3dDmKxdr1QXw4exs++LQea9bbs5BPuAHdY489cOmll7LaX7jAktBPFfrBVnNIyYEl65NgPm4mbZcAKFI/Fwr6AgBvz4jb0olu4vr6+lB9gA0bNkQ3kQ1Gq/sFSvPTcdiBGSgdlAaPx54nB1paJCrqGvHBp1tRUdtgy7r9kS7H7OxsXHPNNcjJyYl0KPsnjoBlC/20hsiWCYBy2u/3DwwGxceQsnNrEPj75BBQ9QHuu+8+qHsD2H4i0C5NYN/Sdti/LD1UYtjttnYyEAhIqJK9n5c34H8V27Ct0Xl7P3a0tl0uF6644gr07t2by19fAhtcbhxUWFg4R1+JbVdm2wRAIamuri4yTZUEILvtiDgyngTKy8vx7LPPOnJTYGtcM9IFSvLTMbggDUUDU9ExxxqvCdZvDKJ6ThPKaxtRUdOArQ380P9jrIUQOOuss1BWVtbaMuDvk0RACLFZGOZhRUVF5UmSEHeztk4Afk4CykxTzGASEPe11GYDakOg2hjItnMCvXp4MKBPKgr6pqLf7ino3lWPhGDFqiDmfd8cOrZXt7AJSx10br+ta5ZX/LaVXMLGbQsaxlFlxfmfJsxiEgzZPgFQTCuqq4cYQfG+esKaBMY0GQaBf/3rX/jyyy/D6MkuvxDIyjCw+y4e9M5TPynoledGbicXOmTHJzHYuNnEqrUBLF0ewOLlzVi8vAXfL2nBlq32vO0xXitt7733xhlnnAlh7bc78cKjw7zNEO5jvd6BM3QQE08NjkgAFECfr/ovAkLVomUSEM8V1ca51T6Ahx9+GN9++20bZ+CwXwikeIDuXTzI7exCTpYLmZkG2me4kJUpkJJiINXzU8/09J+qzTU0/PQB3tQCNDeb2FIvsXlrEPX1JjZuCWL12iBWrGlBs3MK8sVtMfXv3x8XXnghd/zHjXDUEzeb0jihtDR/etQzWWACxyQAoSTAX3eYCATf5A2Ceq5MVSHw/vvvx/Lly/UUSFUkEAWBvLw8XH755UhPT49iFg6NI4FmU5onl5YWO+PSkp9v0YvP88I4RimaqSsr5xwNGXiNSUA0FOM3Vh0PnDhxIlatWhU/I5yZBBJMoGvXrqEP/6ysrARbprkwCQQkjJNLSvLVF0THNEc9Afglqj5f7V8FzJeZBOi5zjdu3IgHHngAa9as0VMgVZFABAQ6d+4c+vDnWf8IoCW2a7MB47SiknzH7UR2ZAIQeh3gqz1SwHydSUBi/6WFa23t2rWhJICFgsIlxn46EujQoQMuu+wyqCSATUsCzRCuUV7voHe0VBdnUY5NABTXyso5w4UM/EcCaXHmzOnbQEC9BlBJwObNm9swmkNIILkE2rdvHyrx261bt+QKofUdEWiCcB/nhN3+OwLg6ARAQamoqB1mCPMNng7Q86+ESgImT57MJwF6hoeqdkBAlfi95JJL+OGv7wrZZkrjuNLS/A/1lRh/ZY5PAEJJgKoTYIq3WSwo/guuLRbWrVuHSZMmQb0WYCMB3Qmox/7qwz83l1eR6BgrVeHPdLmOLikcqO6LcXRjAvBz+H8qG2zM4N0Bev572LRpUygJWLlypZ4CqYoE1O1jubkYO3YsOnbsSB46EhBircslDy8sLKzSUV6iNTEB+A3xmpqaPQMtUj0S6pHoQNBe6wS2bNkSKha0ZMmS1juzBwkkmEDPnj1x0UUXQb37Z9OSwI9ujxhWUFAwX0t1SRDFBOAP0Cv/V9kLKa73IdAvCfGgyVYINDY24qmnnsKcOba8nIvxtyiBgQMHYsyYMUhL435iTUM4H03B4d59vUs11ZcUWUwAtoN97ldzc5pSW96RJvZJSlRodKcEVNng1157DZ9//jlJkUDSCey///446aSTWN436ZHYvgBh4MvUJs9RA/YesFFTiUmTxQRgB+jffrs8NS8v9VUBeXQyouMyggia9ijSGC9fPvjgA0ybNi2hVwnHyxeusegIJCMu6kpfdavfYYcdFp34P4xOhi8xdeA3kyXbFwnx9vLlTScffXRZU7x8tPK8TABaiV5lhf9RCJxj5SDbWXtFRQXUTYItLbypxs5x1s03j8eDM844A6WlpbpJo55fCYinvCUF5xHIjgkwAQhjdVRW1twIKW8Ooyu7JIHA0qVL8cQTT0AdF2QjgXgT6NSpE84991z06tUr3qY4f1sJCHGz11twe1uHO2UcE4AwI13tqx5tQjwOwB7P5cP02yrdtm7dimeffZabA60SMIvqHDBgAM466yxkZmZa1APbyw4aQp5X5C161vaexsBBJgARQKyoqDnCEPJVABkRDGPXBBEwTRPT330X773/fkL3BSTIPZpJIgH1vv+Iww/HiCOPhGEYSVRC0zshsNWU4uTS0oL3SCk8AkwAwuP0ay+/318cDEDdF81aARGyS1R3v98f2hewbdu2RJmkHRsTaNeuXeh9f2FhoY29tLxrP7rcOIYFfiKLIxOAyHiFeldXV3c3TfEmJLgDqA38EjFEXSn8wgsvYO7cuYkwRxs2JdCvXz+ceeaZvMpX6/jKKsOFo4uKilZoLVNDcUwA2hiUGTOq03JzXS9Amse2cQoOizMBKYGPPvowdFRQ1Q5gI4FwCbhcrtARv0MOGQah/kqy6UlAGFM3bsw9Y+jQ3AY9BeqtiglAlPGp9FXfBohrAfDPRJQs4zVcnRJ47rnnsGIFvyDEi7Gd5u3evTtGjx7NXf56B1UC8m5vSdFNesvUWx0TgBjEp6Ki6nhDGM9wc2AMYMZpClUnYMb77+P9GTOgNguykcAfCajNfYcPH47hhx8Odc6fTVsC20xpnl1aWvxvbRVaRBgTgBgFqqqqqlCaYiogdo3RlJwmDgSWL1+Ol156CYsXL47D7JzSqgR69+6N0047DXl5eVZ1wSG65Q/CkMcWFxf7HeJwXN1kAhBDvL5PfR2NDNdrUoihMZyWU8WYgHoC8Mknn+Ctt95Cc3NzjGf/v/buBcaO+rrj+Dkzd3dtjI2NscH4BcImfuzbls0jGJYAKY4gBVNC0koJtGrTF1FKJETaFEjakkilFaVq2iihVGqhcUGQRDEqBDaEQFjL3sfdXa+DjcDYYLADBr/Xe2dONduEEkqi3b2PnZnzvdJqUXTn/z+/z7nRHt87d4blsiRQX18vV199tVxyySV8vS/ljVOzzvhI9In2de1vpbzUzJTHAFDhVpmZ9nYP3CVqt3BeQIVxK7zcgQMH5KGHHpKenp4Kr8xyWRBoa2uTDRs2yKmnnpqFcj3XaGJ6d2t7422qap4hKp2dAaDSoj9fr6974JpYon8VUS4ZViXjSi27c+fO0UHglVdeqdSSrJNigUWLFsl1110nS5YsSXGVlPa/AnY4kPDGlvbGRxCpvAADQOVN312xWCwujUbkv0SlsYrbsHQFBJKvDHZ1PS+PPvqoHDx4sAIrskTaBJLL91577bWydu15fLUvbc35gHrUZHuspQ3t7e0/zUC5mSyRAaDKbUtuK7xofv0/xSKfrvJWLF8BgWPHjklnZ6c8+eSTkvw3j+wLTJkyRS677DLp6OiQqVOnZj+QgwSxxf9x8OCZn+X7/dVtNgNAdX3/792AnuLvxib3mMiUGm3JNmUIJJcR/sGTP5DOpzpleJhbiZdBOWmHNjQ0SMelHXLZRy6T5HK+PNIvoCLHA5XPNbc1fyv91Wa/QgaAGvZwYGCgsTRiD5jZihpuy1ZlCBw+fFieeOIJefrpp/nGQBmOtTw0ObP/4osvlssvv5y79tUSvsy9VHVboU4/1djYOFDmUhw+RgEGgDFCVeppu3c/V/+z/dPvFrHP8i2BSqlWf51kEHjmmWdGBwHOEai+90R2mDFjxugf/osuuog//BMBnLxjTET/ec+rw1+46qrVvN1Wwz4wANQQ+71bdXcPfEwl/qaIzJmkEth2AgLJFQU3b948eo7A66+/PoEVOKTSAqeffvroZ/xr1qzhCn6Vxq3+evtNgt9rb2/8fvW3Yof3CzAATOJrYmDzwJxSnf2bmV0xiWWw9QQEkm8NDA1tG72g0ODgoFjyP/ComUBy2d7GxkZZt26dLF++grP6ayZfuY1U9fHCiH66cU3j/sqtykrjEWAAGI9WlZ7b21u82WK5S0QaqrQFy1ZR4M0335Rnn3tWnv/J85LchphH9QRmz54tF154oZx33nncord6zNVeedgk/mJ7e+s91d6I9X+9AANASl4h/f39K6OSPMgJgilpyATKSC4xvH37dunq6pLe3l5JPi7gUb5AclJfS0uLnH/++fKhDy3jX/vlk07aCpzoN2n0H7gxA0CK+jF6guC+k/9aVD4nIkGKSqOUcQocP35cisWibNmyRYaGhiSKonGu4Pvpyd34krf4V61aNfo7GQJ4ZFogFpN7Tpt7+M8XLryAG3CkpJUMAClpxHvL6OnvX6sn7FumsiyF5VHSOAWSCwoNDAxIX1/f6DDABYY+GDC5SM/y5cultbVVmpqaJPkeP48cCJj8VOr1prampq4cpMlVBAaAlLazs7OzbuaMWXeKBn8mIoWUlklZ4xRIPiZ46aWXZGjbNhkYHJTdu3e7PYFQVWXhwoXSuHKlLF+xQs4++2zuyDfO11PKn14Si//utLlH7+Bf/ensFANAOvvyblW9vb2rLA7uE5GVKS+V8iYgkFxTYMeOHaNDQXJToj179kgyJOTxkZy5v2DBgtGb8CR/7JcuXSrJd/d55FJgUIP4ptbW1q25TJeTUAwAGWjkpk2bCvPmLfySmN3KuwEZaFgZJSaXHd61a5e8+OKLo79fffVVSb5lkMVHcsb+/PnzZfHixXLOOeeM/uZt/Sx2clw1l0T1a3v37v7K+vXrS+M6kifXXIABoObkE9+wr6+vJSrZfapBy8RX4cisCSTnDOzdu3d0GEh+kgsQ7d+/Xw4cOJCKKLNmzZI5c+bIGWecMfoHP/mZN28eN95JRXdqWkQxCO3GlpaWvpruymYTFmAAmDDd5BxoZtrbW/wTifXLojJ9cqpg1zQInDhxYvTdgeTaA8kwkPw+cuTI6E9y6eL3/iTPHc8jOes+uX3ue3+mTZsmyc/MmTMl+aOf/E7+lc8Z+uORzeFzTQ5pKLe3tDTdq6pcEStDLWYAyFCz3ltq94+7T9dpdX8vZtdnNAJl11gg+Xgh+Tpi8vP+Oxwmb82HYTj6w9v0NW5MlrdT3WhHRj7f/uH2N7Icw2vtDAAZ73xP/7ZLZaT0jyJybsajUD4CCGRGQHdIXfjHbU0rnspMyRT6/wQYAHLwoti40cIlS/puVQluE5GpOYhEBAQQSKfAMZP4rp07W752/fXK1a3S2aMxV8UAMGaq9D+xWCwujqPwH8yij6W/WipEAIEsCaiG3w/C6Obm5uZdWaqbWn+1AANADl8dPT3bPmrxiXtUgyU5jEckBBCooYBZvNMk/PyqVU2P1XBbtqqBAANADZAnY4uffyzwpyrBX4jIzMmogT0RQCDTAm+bxH+1c2fLvbzdn+k+/sriGQDy2dd3U23p3DIrnNFwp6j9PhcRynmziYdAZQRKYvqN6ODw7as7VqfjYhOVycUq7xNgAHDykujt7T3HrPBVsfgaJ5GJiQAC4xXQ4JEgiG5raWnZOd5DeX72BBgAstezsioevdNgZHdbLOeVtRAHI4BAbgQ0kOct1Fu4Y19uWjqmIAwAY2LK35O2bh1Yr1L6CpcVzl9vSYTAWAXM4j6TwpdWrWrcNNZjeF5+BBgA8tPLCSXp6x64Jpb4Du42OCE+DkIgqwKDgQR3tLQ3PpLVANRdvgADQPmGuVihp6f4CTG5nSsK5qKdhEDgVwm8ICp3trU1fxsiBBgALzBtOgAACs9JREFUeA28K5DcaKi/t/93IpO/FJGzoUEAgdwIvBSqfLmptenfuWFPbnpadhAGgLIJ87dAcg2BZUv7PxOZJJcWPit/CUmEgBuBl0OVu7bvaLqf7/K76fmYgzIAjJnK3xPNLOjv7f/tOJZbTWWZPwESI5BNATXZboF9tbW1+QFVjbOZgqqrLcAAUG3hnKyfnCxYsviLgUpbTiIRA4HcCcQmPQUN/oaT+3LX2qoEYgCoCmt+F+0ubuuQUvQFFbtCRJLXDw8EEJhcATPRx6UQ/m1784rOyS2F3bMkwACQpW6lqNZisbjCSnJLLPJJEalPUWmUgoAXgROByINakLubm5u3eQlNzsoJMABUztLlSgObB+aU6uWPLI6Tew2c7hKB0AjUVuANDYJvlA4e//rqdav31XZrdsuTAANAnro5iVk2bdpUmDdv/g1qerOJtE9iKWyNQC4FVKQ7ULl3z949D65fv76Uy5CEqqkAA0BNuX1s1l0srglK9oci+lsmMsVHalIiUBWBYRXbGBf06+3NzZursgOLuhVgAHDb+uoHH+oamnm8/sSNatEfmBSWVH/H6u8QBpFEcVj9jWqwA1lqgDyBLZK+lCLdqYH+S/T2yP3ckncCiBwyJgEGgDEx8aRyBbb2DV4spZGbQg028K5AuZocn0cBFTkeWfywFOruW9Wy8uk8ZiRTugQYANLVj9xXM/jc4CkjJ0Wfklhu5FyB3LebgGMQSO7IF4TBN+uOhg+svGDlO2M4hKcgUBEBBoCKMLLIRASSrxLGpeAzJvENInLmRNbgGAQyKvCaSvCfQSG+n6/wZbSDOSibASAHTcxDhJ6ebR8NJfpkZPFviujJechEBgR+WcAOx2bfCYL6B9raVvw3OghMtgADwGR3gP1/SWD37ufq9+076aogKNwgFq8XkQaIEMiwwLBosCmOS9+eO/fodxcuvOBEhrNQes4EGABy1tA8xXniiS0nz51d9/FYZIOKXsHJg3nqbn6zJCfzmdjjgcjD+94c+c7ll68+nN+0JMuyAANAlrvnqPbtP95/0pGpr64vqG6IRa7kYwJHzc9G1COB2KaS2cPTjs3ftOzDc45mo2yq9CzAAOC5+xnN3tnZWXfK7LkdQSn+uIldxQmEGW1k9st+TUW/Zxp+9+2333iqo6NjJPuRSOBJgAHAU7dzmrW/v79tZCS6UiW4UkTWikiQ06jEmlyBWFW3xhZ9r64ufKypqalncsthdwTKE2AAKM+Po1Mm0P2j7lML0wtXiOhvRKIfEYvnpaxEysmSgAZ747j0VF0QPFY6VHq8fV37W1kqn1oR+HUCDAC8PnItUCwWl5ZK8SWh6KWx6MUiMjfXgQlXrsC+QOzpSOypQiH4YXNz845yF+R4BNIqwACQ1s5QV1UEent7l8WxXKpa6BCL14nI7KpsxKJZEXhTNPhRYNEPLbAnW1tbt2elcOpEoFwBBoByBTk+0wI9PT1NoYQXlkzXqNlaUTlXRJL/X/DIn4CJyQum2lVQ2xxJ9GxbW1t//mKSCIGxCTAAjM2JZzkR6OzsmT59VmFNEEdr1XSNqK7hY4PMNn+/mHWZ2uY4CLsOHSht7uhoO5TZNBSOQIUFGAAqDMpy+RPo6+tbFEWyVi1YZRa1aBC0isic/CXNdKL9Fse9qmGfabw1DKWrpaXllUwnongEqizAAFBlYJbPp8DA5oE5w6G2BoE1BxavMNUVFtsyUZmez8QpSWVySAPdrmbbLJChKAr77MixvtXrVu9LSYWUgUBmBBgAMtMqCs2CQM9PehbG9fXLVEeWigXniupSNVsiKmeJSJiFDCmoMRKTl011p5jtEI1fMKvbEZw4sb3t/LbdKaiPEhDIhQADQC7aSIi0C2zcaOHKldsWDUd6VlgaWWxBuFji6CwTXWwWnxlosMDLvQ6Sa+XHFu8RLewNJHo5jm1XGOquKKx7uSG0lwcHV7xy/fUapb2n1IdA1gUYALLeQerPjcBQ19DMkakjZ5YkXCCl+DSRaI5qeEZgNjcSmaMis8TkVFGZJcl/i9SlJHxyCdwDYnJAQzkQx/JWKLI/Vt1nFr0uEu6XQvCzgkR76o7VvbZ87fK3U1I3ZSDgWoABwHX7CZ9lgc7OfVNPqdszo2FWw0lRFJ0yHEXTC9JwkohNM4unFNSmmllogc74RU4znWGRfeBHERpqpGoHf/Fcje2gqkYl02OqwXERPVKS4aMNYXgoDMN3hg8MH31nZMHBjo65x7LsSO0IeBVgAPDaeXIjgAACCLgWYABw3X7CI4AAAgh4FWAA8Np5ciOAAAIIuBZgAHDdfsIjgAACCHgVYADw2nlyI4AAAgi4FmAAcN1+wiOAAAIIeBVgAPDaeXIjgAACCLgWYABw3X7CI4AAAgh4FWAA8Np5ciOAAAIIuBZgAHDdfsIjgAACCHgVYADw2nlyI4AAAgi4FmAAcN1+wiOAAAIIeBVgAPDaeXIjgAACCLgWYABw3X7CI4AAAgh4FWAA8Np5ciOAAAIIuBZgAHDdfsIjgAACCHgVYADw2nlyI4AAAgi4FmAAcN1+wiOAAAIIeBVgAPDaeXIjgAACCLgWYABw3X7CI4AAAgh4FWAA8Np5ciOAAAIIuBZgAHDdfsIjgAACCHgVYADw2nlyI4AAAgi4FmAAcN1+wiOAAAIIeBVgAPDaeXIjgAACCLgWYABw3X7CI4AAAgh4FWAA8Np5ciOAAAIIuBZgAHDdfsIjgAACCHgVYADw2nlyI4AAAgi4FmAAcN1+wiOAAAIIeBVgAPDaeXIjgAACCLgWYABw3X7CI4AAAgh4FWAA8Np5ciOAAAIIuBZgAHDdfsIjgAACCHgVYADw2nlyI4AAAgi4FmAAcN1+wiOAAAIIeBVgAPDaeXIjgAACCLgWYABw3X7CI4AAAgh4FWAA8Np5ciOAAAIIuBZgAHDdfsIjgAACCHgVYADw2nlyI4AAAgi4FmAAcN1+wiOAAAIIeBVgAPDaeXIjgAACCLgWYABw3X7CI4AAAgh4FWAA8Np5ciOAAAIIuBZgAHDdfsIjgAACCHgVYADw2nlyI4AAAgi4FmAAcN1+wiOAAAIIeBVgAPDaeXIjgAACCLgWYABw3X7CI4AAAgh4FWAA8Np5ciOAAAIIuBZgAHDdfsIjgAACCHgVYADw2nlyI4AAAgi4FmAAcN1+wiOAAAIIeBVgAPDaeXIjgAACCLgWYABw3X7CI4AAAgh4FWAA8Np5ciOAAAIIuBZgAHDdfsIjgAACCHgVYADw2nlyI4AAAgi4FmAAcN1+wiOAAAIIeBVgAPDaeXIjgAACCLgWYABw3X7CI4AAAgh4FWAA8Np5ciOAAAIIuBZgAHDdfsIjgAACCHgVYADw2nlyI4AAAgi4FmAAcN1+wiOAAAIIeBVgAPDaeXIjgAACCLgWYABw3X7CI4AAAgh4FWAA8Np5ciOAAAIIuBZgAHDdfsIjgAACCHgVYADw2nlyI4AAAgi4FmAAcN1+wiOAAAIIeBVgAPDaeXIjgAACCLgWYABw3X7CI4AAAgh4FWAA8Np5ciOAAAIIuBZgAHDdfsIjgAACCHgVYADw2nlyI4AAAgi4FmAAcN1+wiOAAAIIeBVgAPDaeXIjgAACCLgWYABw3X7CI4AAAgh4FWAA8Np5ciOAAAIIuBZgAHDdfsIjgAACCHgVYADw2nlyI4AAAgi4FvgfzL5TdILRaNgAAAAASUVORK5CYII="
createMainDOM()

//Normalize Site Name so we don't have repeat keys in larger infoparser dict
standardNames={
"www.imdb.com":"imdb.com",
"www.themoviedb.org":"themoviedb.org"
}

infoParser={
  "animebytes.tv":{
  "title":"h2>a[href*=series]",
  "titleAttrib":"textContent"
  },
  "blutopia.xyz":{
  "title":"h1>a[href*=torrents\\/similar]",
  "titleAttrib":"textContent",
  "imdb":"div[class*=movie-details]>span:nth-child(3)>a",
  "imdbAttrib":"textContent"
  },

  "beyond-hd.me":{
  "title":"h1[class=movie-heading]",
  "titleAttrib":"textContent",
  "imdb":"ul[class*=movie-details]>li>span>a[href*=imdb]",
  "imdbAttrib":"href"
  },
  "imdb.com":{
  "title":"h1",
  "titleAttrib":"textContent",
  },
  "themoviedb.org":{
    "title":"h2",
    "titleAttrib":"textContent",
  },
}
program="Torrent Quick Search"
siteParser=getParser()

GM_config.init(
{
  'id': 'torrent-quick-search',
  'title': 'Torrent Quick Search Settings', // Panel Title
  'fields':
  {
     'tmdb':
    {
      'label': 'TMDB API Key',
      'type': 'text',
      'title':'TMDB Key For TMDB/IMDB conversion'
    },


    'url':
    {
      'section': ['Search'],

      'label': 'URL',
      'type': 'text',
      'title':'Base URl for program'
    },
        'api':
    {
      'label': 'API Key',
      'type': 'text',
      'title':'API key for program'

    },
       'type':
    {
      'label': 'type',

      'type': 'select',
      'options': ['Prowlarr'],
         'title':'Which Program'
    },

    'sitefilter':
    {
      'label': 'Filter Current Site',

      'type': 'radio',
      'options': ['true', 'false'],
      'title':'Should Results From Current Site be Filtered Out'
    },

        'indexers':
    {
      'label': 'Indexers',
      'section': ['Indexers'],
      'type': 'text',
     'title':'Comma Seperated List of Indexers Names'
    },

      'listType':
    {
    'type': 'radio',
      'options': ['black', 'white'],
      'label': 'Indexers ListType',
      'title':'What Type of List?'

    },

  'fontsize':
    {
      'label': 'Font Size',
      'section': ['GUI'],
      'type': 'int',
     'title':'fontsize',
      'default':12
    },

  },
    'events':
  {
    'open': openMenu,
    'close':closeMenu },
  }
);
GM.registerMenuCommand('Torrent Quick Search Settings', function() {GM_config.open();});

