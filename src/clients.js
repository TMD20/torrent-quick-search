//helpers
function arrIMDBHelper(releaseData) {
  let pageIMDB = document.querySelector(
    "#torrent-quicksearch-imdbinfo"
  ).textContent;
  if (releaseData["ImdbId"] != imdbParserFail) {
    return parseInt(releaseData["ImdbId"]);
  } else if (pageIMDB != imdbParserFail && pageIMDB != null) {
    return parseInt(pageIMDB);
  } else {
    return;
  }
}

function arrNotificationHelper(data,type){
  let initValue = ""
  let finalMsg=null
  switch (type) {
    case "radarr":
      finalMsg = data.reduce((prev, curr, index) => {
        if (curr["rejected"] == true) {
          let errorMsg = [
            `${curr["movieTitles"].join(",")}`,
            `Status Rejected: ${curr["rejections"].join(",")}`,
          ];
          return `${prev}\n\[${errorMsg.join("\n")}\]`;
        }
        if (curr["approved"] == true) {
          let acceptMsg = `Added ${curr["title"]} to client`;
          return `${prev}\n${acceptMsg}`;
        }
      }, initValue);
      break;
    
    case "sonarr":
  
    finalMsg = data.reduce((prev, curr, index) => {
      if (curr["rejections"].length > 0) {
        let epNums =
          curr["mappedEpisodeNumbers"].length > 0
            ? curr["mappedEpisodeNumbers"].join(",")
            : "No Episodes";
        let errorMsg = [
          `${curr["seriesTitle"]} Season ${curr["seasonNumber"]} Episodes ${epNums}`,
          `Status Rejected: ${curr["rejections"].join(",")}`,
        ];
        return `${prev}\n\[${errorMsg.join("\n")}\]`;
      } else if (curr["approved"] == true) {
        let acceptMsg = `Added ${curr["title"]} to client`;
        return `${prev}\n${acceptMsg}`;
      }
    }, initValue)
    break;

  
     


  

}
GM.notification(finalMsg, program, searchIcon);

}


function clientFactory(releaseData) {
  let clientEvent = async function (e) {
    e.preventDefault();
    e.stopPropagation();
    let clientData = JSON.parse(
      GM_config.getValue("downloadClients", "[]")
    ).filter(
      (ele) => ele.clientID == e.target.querySelector("select").value
    )[0];
    if (e.submitter.textContent=="Send"){
      return clientFactorySendHelper(releaseData,clientData)
    }
  
    return clientFactoryForceHelper(releaseData,clientData)

    
  }
  return clientEvent
}

async function clientFactorySendHelper(releaseData,clientData) { 

    switch (clientData.clientType) {
      case "Sonarr":
         return (async()=>{
          releaseData=await getSonarrReleaseData(releaseData)
          await addSonarrSeries(releaseData, clientData)
          data=await sendSonarrClient(releaseData, clientData);
          if(data){
            arrNotificationHelper(data,"sonarr");
          }

         })();
         
      case "Radarr":
        return (async()=>{
          releaseData=await getRadarrReleaseData(releaseData)
          await addRadarrMovie(releaseData, clientData)
          data=await sendRadarrClient(releaseData, clientData);
          if(data){
            arrNotificationHelper(data,"radarr");
          }

         })();
         
        case "Rtorrent":
         return sendRtorrentClient(releaseData, clientData);
        case "Qbittorrent":
          return (async()=>{
            let sid=await getQbittorrentSID(getientData)
            if (sid){
              await qbittorrentAddTorrents(releaseData,clientData)
            }
            await qbittorrentLogout()
        
  
           })();
           case "Transmission":
            return (async()=>{
              let id=await getTranmissionSessionID(clientData)
              if (id){
                await sendTorrentTransmission(releaseData,clientData,id)
              }
            
             })();    
             
             case "Nzbget":
              return (async()=>{
                await sendNzbgetClient(releaseData,clientData)
              
               })();   
               case "Sab":
                return (async()=>{
                  await sendSabClient(releaseData,clientData)
                
                 })();     
          
      default:
    }
   }

async function clientFactoryForceHelper(releaseData,clientData) { 

  // switch (clientData.clientType) {
  //   case "Sonarr":
  //      return forceSonarrClient(releaseData, clientData);
  //   case "Radarr":
  //      return sendRadarrClient(releaseData, clientData);
  //     case "Rtorrent":
  //      return sendRtorrentClient(releaseData, clientData);
  //   default:
  // }
 
}

function xmlEncode(input) {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

//sonarr functions

async function addSonarrSeries(releaseData, clientData){
  if (releaseData["TvdbId"]==null){
    return
  }
  let res = await fetch(
    searchSeriesSonarrURL(releaseData,clientData["TvdbId"]),
    {
      method: "get",
      semaphore: false,
    }
  );

  if (res.status != 200) {
    console.log(res.responseText)
    return;
  }
  

  let res2 = await fetch(
    addSeriesSonarrURL(clientData),
    {
      method: "post",
      data: JSON.stringify(JSON.parse(res.responseText)[0]),
      semaphore: false,
    }
  );

  console.log(res2.responseText)

}


async function addSonarrSeries(releaseData, clientData){
  if (releaseData["TvdbId"]==null){
    return
  }
  let res = await fetch(
    searchSeriesSonarrURL(releaseData,clientData["TvdbId"]),
    {
      method: "get",
      semaphore: false,
    }
  );

  if (res.status != 200) {
    console.log(res.responseText)
    return;
  }
  

  let res2 = await fetch(
    addSeriesSonarrURL(clientData),
    {
      method: "post",
      data: JSON.stringify(JSON.parse(res.responseText)[0]),
      semaphore: false,
    }
  );

  console.log(res2.responseText)

}

async function sendSonarrClient(releaseData, clientData) {
  let res = await fetch(
    releasePushSonarrURL(clientData),
    {
      method: "post",
      data: JSON.stringify(releaseData),
      semaphore: false,
    }
  );

  if (res.status != 200) {
    GM.notification(res.responseText, program, searchIcon);
    return
  }
  return JSON.parse(res.responseText);
} 

async function getSonarrReleaseData(releaseData){
  releaseData=JSON.parse(JSON.stringify(releaseData))
  releaseData["ImdbId"] = arrIMDBHelper(releaseData);
  releaseData["TvdbId"] = await tmdbTVDBConvertor(releaseData["ImdbId"]);
  releaseData["tmdbId"] = (await imdbTMDBConvertor(releaseData["ImdbId"]))?.id;
  return releaseData
}
//radarr
async function getRadarrReleaseData(releaseData){
  releaseData=JSON.parse(JSON.stringify(releaseData))
  releaseData["ImdbId"] = arrIMDBHelper(releaseData);
  (releaseData["TvdbId"] = await tmdbTVDBConvertor(releaseData["ImdbId"])),
    (releaseData["tmdbId"] = (
      await imdbTMDBConvertor(releaseData["ImdbId"])
    )?.id);
    return releaseData
}
async function sendRadarrClient(releaseData, clientData) {
  let res = await fetch(
    getRadarrURL(clientData),

    {
      method: "post",
      data: JSON.stringify(releaseData),
      headers: { "content-type": "application/json" },
      semaphore: false,
    }
  );

  if (res.status != 200) {
    GM.notification(res.responseText, program, searchIcon);
  }
  return JSON.parse(res.responseText);
}

async function addRadarrMovie(releaseData, clientData){
  if (releaseData["ImdbId"]==null || releaseData["ImdbId"]==null){
    return
  }
  let res = await fetch(
    searchMoviesRadarrURL(releaseData,clientData),
    {
      method: "get",
      semaphore: false,
    }
  );

  if (res.status != 200) {
    console.log(res.responseText)
    return;
  }
  

  let res2 = await fetch(
    addMoviesRadarrURL(clientData),
    {
      method: "post",
      headers: { "content-type": "application/json" },
      data: JSON.stringify(JSON.parse(res.responseText)[0]),
      semaphore: false,
    }
  );

  console.log(res2.responseText)

}



//rtorrent

function getRtorrentMethod(clientData) {
  if(clientData.clientAuto=="Yes"){
    return "load.normal"
  }
  return "load.start"
}






function getRtorrentxml(downloadurl, args, method) {
  return text = 
    `
      <methodCall>
    <methodName>${method}</methodName>
    <params>
        <param>
           <value><string></string></value>
            </param>
         <param>
            <value><string>${xmlEncode(downloadurl)}</string></value>
            </param>
            ${args.map((e) => {
              return `<param>
               <value>
                 <string>${e}</string>
               </value>
             </param>`;
            })}
        </params>
    </methodCall>`
    ;
}

function getRtorrentArgs(clientData){
  let args=[]
  let label=clientData.clientLabel
  let directory=clientData.clientDir
  if (label != "" && label != null && label != "none") {
    args.push(`d.custom1.set=${label}`);
  }

  if (directory != "" && directory != null && directory != "none") {
    args.push(`d.directory.set=${directory}`);
  }
  return args



  
}

async function sendRtorrentClient(releaseData, clientData) {
  let t = getRtorrentxml(
    releaseData["DownloadUrl"],
    getRtorrentArgs(clientData),
    getRtorrentMethod(clientData)
  );
  let res = await fetch(getRtorrentURL(clientData), {
    data: getRtorrentxml(
      releaseData["DownloadUrl"],
      getRtorrentArgs(clientData),
      getRtorrentMethod(clientData)
    ),
    method: "post",
    headers: {
      Authorization: `Basic ${btoa(
        `${clientData.clientUserName}:${clientData.clientPassword}`
      )}`,
    semaphore:false
    },
  });
   if (res.status != 200) {
     GM.notification(res.responseText, program, searchIcon);
     return;
   }
   GM.notification(`${releaseData["Title"]} was succesfully added`, program, searchIcon);
}
async function getSonarrReleaseData(releaseData){
  releaseData=JSON.parse(JSON.stringify(releaseData))
  releaseData["ImdbId"] = arrIMDBHelper(releaseData);
  releaseData["TvdbId"] = await tmdbTVDBConvertor(releaseData["ImdbId"]);
  releaseData["tmdbId"] = (await imdbTMDBConvertor(releaseData["ImdbId"]))?.id;
  return releaseData
}

///Qbittorrent Functions
async function getQbittorrentSID(clientData){
  let res = await fetch(getQbittorrentLoginURL(clientData), {
    method: "get",
    headers: {
      Origin: clientData.clientURL,
    },
    responseType:"json",
    semaphore:false
  });
   if (res.status != 200) {
     GM.notification(res.responseText, program, searchIcon);
     return false;
   } 
   return true
}

async function qbittorrentLogout(clientData){
  let res = await fetch(getQbittorrentLogoutURL(clientData), {
    method: "get",
    headers: {
      Origin: clientData.clientURL,
    },
    semaphore:false
  });
   console.log(res.responseText) 
}

async function qbittorrentAddTorrents(releaseData,clientData){
  const formData = new FormData();
  formData.append("urls",releaseData.DownloadUrl)
  formData.append("savepath",clientData.clientDir)
  formData.append("category",clientData.clientCategory)
  formData.append("paused",clientData.clientAuto=="No") 
  formData.append("tags",clientData.clientTags) 
  formData.append("root_folder",true) 


    let res = await fetch(getQbittorrentAddTorrentsURL(clientData), {
    method: "post",
    headers: {
      Origin: clientData.clientURL,
    },
    data:formData,
    semaphore:false
  });
  if(res.status!=200){
    GM.notification(`Error adding Torrent \n${res.responseText}\n${res.responseHeaders}`, program, searchIcon)
  }
  GM.notification(`Added Torrent \n${res.responseText}\n${res.responseHeaders}`, program, searchIcon)

}

//transmission
async function getTranmissionSessionID(clientData) {
  let res = await fetch(getTransmissionRPCURL(clientData), {
    method: "post",
    headers: {
      Authorization: `Basic ${btoa(
        `${clientData.clientUserName}:${clientData.clientPassword}`
      )}`,
    },
    semaphore:false
  });
   if (res.status != 200 && res.status!=409) {
     GM.notification(res.responseText, program, searchIcon)
     return;
   }
   return res.responseHeaders.split('\r\n').filter((x)=>x.match("session-id"))[0].replace("x-transmission-session-id: ","")
}

async function sendTorrentTransmission(releaseData,clientData,id) {
  let res = await fetch(getTransmissionRPCURL(clientData), {
    method: "post",
    headers: {
      Authorization: `Basic ${btoa(
        `${clientData.clientUserName}:${clientData.clientPassword}`
      )}`,
      "X-Transmission-Session-Id":id,
      "Content-type":"application/json"
    },
    semaphore:false,
    data:JSON.stringify({
      "arguments": {
        "filename":releaseData.DownloadUrl,
        "download-dir":transmissionDownloadDirHelper(clientData.clientDir),
        "labels":clientData.clientLabels,
        "groups":clientData.clientGroups,
        "paused":clientData.clientAuto=="No"
      },
     "method": "torrent-add"
   })
  });
  if (res.status!=200){
    GM.notification(`Error Adding Torrent\n${res.responseText}`, program, searchIcon)

  }
  GM.notification(`Added Torrent\n${res.responseText}`, program, searchIcon)

}
//Tranmission won't accept empty download_dir

async function transmissionDownloadDirHelper(dir){
  if (dir!=""){
    return dir
  }

  let res = await fetch(getTransmissionRPCURL(clientData), {
    method: "post",
    headers: {
      Authorization: `Basic ${btoa(
        `${clientData.clientUserName}:${clientData.clientPassword}`
      )}`,
      "X-Transmission-Session-Id":id,
      "Content-type":"application/json"
    },
    semaphore:false,
    data:JSON.stringify({
     "method": "session-get"
   })
  });
  console.log(res.responseText)
  if (res.status!=200){
  return
  }
  return JSON.parse(res.responseText)["arguments"]["download-dir"]

}




//Nzbget
async function sendNzbgetClient(releaseData,clientData){
  let res = await fetch(getNzbgetRPCURL(clientData), {
    method: "post",
    semaphore:false,
    data:JSON.stringify({
      "jsonrpc":"1.1",
      "method": "append",
      "params":[
        releaseData.Title
        ,releaseData.DownloadUrl
        ,clientData.clientCategory
        ,clientData.clientAuto=="No"? 0 : 300
        ,false
        ,clientData.clientAuto=="No"? true : false
        ,""
        ,0
        ,"SCORE"
        
      ]
                
      
    })
  });
  GM.notification(res.responseText, program, searchIcon)
}

//sab
async function sendSabClient(releaseData,clientData){
  let res = await fetch(getSabAddURL(releaseData,clientData), {
    method: "get",
    semaphore:false
  });
  GM.notification(res.responseText, program, searchIcon)
}


/////URL

function releasePushSonarrURL(clientData) {
  let params = new URLSearchParams();
  params.append("apikey", clientData.clientAPI);
  let baseURL = new URL("/api/v3/release/push", clientData.clientURL).toString();
  return `${baseURL}?${params.toString()}`;
}

function releaseSonarrURL(clientData) {
  let params = new URLSearchParams();
  params.append("apikey", clientData.clientAPI);
  let baseURL = new URL("/api/v3/release/", clientData.clientURL).toString();
  return `${baseURL}?${params.toString()}`;
}

function addSeriesSonarrURL(clientData) {
  let params = new URLSearchParams();
  params.append("apikey", clientData.clientAPI);
  let baseURL = new URL("/api/v3/series", clientData.clientURL).toString();
  return `${baseURL}?${params.toString()}`;
}

function searchSeriesSonarrURL(clientData,tvdb) {
  let params = new URLSearchParams();
  params.append("apikey", clientData.clientAPI);
  params.append("term", `tvdb:${tvdb}`);
  let baseURL = new URL("/api/v3/series/lookup", clientData.clientURL).toString();
  return `${baseURL}?${params.toString()}`;
}



function addMoviesRadarrURL(clientData) {
  let params = new URLSearchParams();
  params.append("apikey", clientData.clientAPI);
  let baseURL = new URL("/api/v3/movie", clientData.clientURL).toString();
  return `${baseURL}?${params.toString()}`;
}

function searchMoviesRadarrURL(releaseData,clientData) {
  let params = new URLSearchParams();
  params.append("apikey", clientData.clientAPI);
  if (releaseData["ImdbId"]!=null){
    params.append("term", `imdb:${releaseData["ImdbId"]}`);
  }
  else{
    params.append("term", `tmdb:${releaseData["tmdbId"]}`);
  }
  let baseURL = new URL("/api/v3/movie/lookup", clientData.clientURL).toString();
  return `${baseURL}?${params.toString()}`;
}
function getIndexersSonarrURL(clientData) {
  let params = new URLSearchParams();
  params.append("apikey", clientData.clientAPI);
  let baseURL = new URL("/api/v3/series/indexers", clientData.clientURL).toString();
  return `${baseURL}?${params.toString()}`;
}
function getRtorrentURL(clientData) {
  let baseURL = new URL(clientData.clientURL).toString();
  return baseURL
}



function getRadarrURL(clientData) {
  let params = new URLSearchParams();
  params.append("apikey", clientData.clientAPI);
  let baseURL = new URL("/api/v3/release/push", clientData.clientURL).toString();
  return `${baseURL}?${params.toString()}`;
}

function getQbittorrentLoginURL(clientData) {
  let params = new URLSearchParams();
  params.append("username",clientData.clientUserName);
  params.append("password",clientData.clientPassword);
  let baseURL = new URL("/api/v2/auth/login",clientData.clientURL).toString();
  return `${baseURL}?${params.toString()}`;
}

function getQbittorrentLogoutURL(clientData) {
  let baseURL = new URL("/api/v2/auth/logout",clientData.clientURL).toString();
  return `${baseURL}?${params.toString()}`;
}

function getQbittorrentAddTorrentsURL(clientData) {
  let baseURL = new URL("/api/v2/torrents/add",clientData.clientURL).toString();
  return baseURL
}

function getTransmissionRPCURL(clientData) {
  let baseURL = new URL("/transmission/rpc",clientData.clientURL).toString();
  return baseURL
}

function getNzbgetRPCURL(clientData) {
  let baseURL = new URL(`/${clientData.clientUserName}:${clientData.clientPassword}/jsonrpc`,clientData.clientURL).toString();
  return baseURL
}

function getSabAddURL(releaseData,clientData) {
  let params = new URLSearchParams();
  params.append("mode","addurl")
  params.append("output","json")
  params.append("name",releaseData.DownloadUrl)
  params.append("nzbname",releaseData.Title)
  params.append("cat",clientData.clientCategory)
  params.append("priority",clientData.clientAuto=="No" ? 0:2)
  params.append("apikey",clientData.clientAPI)

  let baseURL = new URL("/api",clientData.clientURL).toString();
  return `${baseURL}?${params.toString()}`;
}