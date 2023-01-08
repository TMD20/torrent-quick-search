let siteName = window.location.host.match(/([a-z]*).[a-z]*$/)[1];
let siteParser = getParser();
async function getIMDB() {
  let imdb = null;

  if (siteName == "imdb") {
    imdb = window.location.href;
  } else if (siteName == "themoviedb") {
    imdb = await tmdbPageIMDBParser();
  } else {
    let imdbNode = document.querySelector(siteParser["imdb"]);
    if (imdbNode == null) {
      return null;
    }
    imdb = imdbNode[siteParser["imdbAttrib"]];
  }

  imdb = imdbCleanup(imdb);
  return imdb;
}

function getParser() {
  let data = infoParser[siteName];
  if (data === undefined) {
    let msg = "Could not get Parser";
    GM.notification(msg, program, searchIcon);
    throw new Error(msg);
  }
  return data;
}

function currSiteFilter(entryURL) {
  if (GM_config.get("sitefilter") == "false") {
    return true;
  }
  if (
    new URL(entryURL).match(/([a-z]*).[a-z]*$/)[1] ==
    siteName
  ) {
    return false;
  }
  return true;
}