function searchIndexer(indexerObj, imdb, total, count) {
  if (controller.signal.aborted) {
    return Promise.reject(AbortError);
  }
  return new Promise(async (resolve, reject) => {
    let msg = null;
    controller.signal.addEventListener("abort", () => {
      reject(AbortError);
    });
    let searchprogram = GM_config.get("searchprogram");
    let data = null;
    if (searchprogram == "Prowlarr") {
      data = await searchProwlarrIndexer(indexerObj, controller);
    } else if (searchprogram == "Jackett") {
      data = await searchJackettIndexer(indexerObj);
    } else if (searchprogram == "NZBHydra2") {
      data = await searchHydra2Indexer(indexerObj);
    }

    msg = `Results fetched from ${indexerObj["Name"]}:${
      count.length + 1
    }/${total} Indexers completed`;
    data = data.filter((e) => imdbFilter(e, imdbCleanup(imdb)));
    data.forEach((e) => {
      if (e["ImdbId"] == 0 || e["ImdbId"] == null) {
        e["ImdbId"] = imdbParserFail;
      }
    });
    data = data.filter((e) => currSiteFilter(e["InfoUrl"]));

    addResultsTable(data);
    count.push(indexerObj["ID"]);
    document.querySelector("#torrent-quicksearch-msgnode").textContent = msg;
    console.log(msg);
    resolve(data);
  });
}

async function searchProwlarrIndexer(indexer) {
  console.log(getSearchURLProwlarr(indexer["ID"]));
  let req = await fetch(getSearchURLProwlarr(indexer["ID"]), {
    timeout: indexerSearchTimeout,
  });
  if (req.status!=200){
    return []
  }
  let data = JSON.parse(req.responseText) || [];
  let dataCopy = [...data];
  let promiseArray = [];
  let x = Number.MAX_VALUE;
  while (dataCopy.length) {
    let newData = await Promise.allSettled(
      dataCopy.splice(0, Math.min(dataCopy.length, x)).map(async (e) => {
        return {
          Title: e["title"],
          Indexer: e["indexer"],
          Grabs: e["grabs"],
          PublishDate: e["publishDate"],
          Size: e["size"],
          Leechers: e["leechers"],
          Seeders: e["seeders"],
          InfoUrl: e["infoUrl"],
          DownloadUrl: e["downloadUrl"],
          ImdbId: e["imdbId"],
          Type:e['protocol']=="torrent"?"torrent":"nzbget",
          Cost:
            e["indexerFlags"].includes("freeleech") == "100% Freeleech"
              ? "100% Freeleech"
              : "No Data",
        };
      })
    );
    promiseArray = [...promiseArray, ...newData];
  }
  return promiseArray.map((e) => e["value"]).filter((e) => e != null);
}

async function searchJackettIndexer(indexer) {
  let req = await fetch(getSearchURLJackett(indexer["ID"]), {
    timeout: indexerSearchTimeout,
  });
  if (req.status!=200){
    return []
  }
  let data = JSON.parse(req.responseText)["Results"] || [];
  let dataCopy = [...data];
  let promiseArray = [];
  let x = Number.MAX_VALUE;
  while (dataCopy.length) {
    let newData = await Promise.allSettled(
      dataCopy.splice(0, Math.min(dataCopy.length, x)).map(async (e) => {
        return {
          Title: e["Title"],
          Indexer: e["Tracker"],
          Grabs: e["Grabs"],
          PublishDate: e["PublishDate"],
          Size: e["Size"],
          Leechers: e["Peers"],
          Seeders: e["Seeders"],
          InfoUrl: e["Details"],
          DownloadUrl: e["Link"],
          ImdbId: e["Imdb"],
          Cost: `${(1 - e["DownloadVolumeFactor"]) * 100}% Freeleech`,
          Type: "torrent",
        };
      })
    );
    promiseArray = [...promiseArray, ...newData];
  }
  return promiseArray.map((e) => e["value"]).filter((e) => e != null);
}
async function searchHydra2Indexer(indexer) {
  let req = await fetch(getSearchURLHydraTor(indexer["ID"]), {
    timeout: indexerSearchTimeout,
  });
  let req2 = await fetch(getSearchURLHydraNZB(indexer["ID"]), {
    timeout: indexerSearchTimeout,
  });
 
  let parser = new DOMParser();
  let test=  (()=>{
    if (req.status!=200){
      return []
    } 
    return Array.from(
      parser.parseFromString(req.responseText, "text/xml").querySelectorAll("channel>item")
    )

  })()
  console.log(test)
  let data = [
    ...(()=>{
      if (req.status!=200){
        return []
      } 
      return Array.from(
        parser.parseFromString(req.responseText, "text/xml").querySelectorAll("channel>item")
      )

    })()

    ,...(()=>{
      if (req2.status!=200){
        return []
      } 
      return Array.from(
        parser.parseFromString(req2.responseText, "text/xml").querySelectorAll("channel>item")
      )

    })()

   
  ];
  let dataCopy = [...data];
  let promiseArray = [];
  let x = Number.MAX_VALUE;

  while (dataCopy.length) {
    let newData = await Promise.allSettled(
      dataCopy.splice(0, Math.min(dataCopy.length, x)).map(async (e) =>
        //array is final dictkey,queryselector,attribute

        {
          let t = [
            ["Title", "title", "textContent"],
            ["Indexer", "[name=hydraIndexerName]", "null"],
            ["Leechers", "[name=peers]", "null"],
            ["Seeders", "[name=seeders]", "null"],
            ["Cost", "[name=downloadvolumefactor]", "null"],
            ["PublishDate", "pubDate", "textContent"],
            ["Size", "size", "textContent"],
            ["InfoUrl", "comments", "textContent"],
            ["DownloadUrl", "link", "textContent"],
            ["ImdbId", "[name=imdb]", "null"],
          ];
          let out = {};
          out["Grabs"] = "Hydra Does not Report";

          for (let i in t) {
            let key = t[i][0];
            let node = e.querySelector(t[i][1]);
            let textContent = t[i][2] == "textContent";
            if (!node) {
              continue;
            }

            if (textContent) {
              out[key] = node.textContent;
            } else if (key == "Cost") {
              out[key] = `${(1 - node.getAttribute("value")) * 100}% Freeleech`;
            } else {
              out[key] = node.getAttribute("value");
            }
          }
          out["Type"] =
            data[0].querySelector("enclosure").getAttribute("type") ==
            "application/x-bittorrent"
              ? "torrent"
              : "nzbget";
          return out;
        }
      )
    );
    promiseArray = [...promiseArray, ...newData];
  }
  return promiseArray.map((e) => e["value"]).filter((e) => e != null);
}
