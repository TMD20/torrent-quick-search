


function recreateController() {
  controller = new AbortController();
}
function semaphoreLeave() {
  if (sem && sem.current > 0) {
    sem.leave();
  }
}

let searchObj = {
  ready: true,
  search() {
    if (controller.signal.aborted) {
      return Promise.reject(AbortError);
    }
    return new Promise(async (resolve, reject) => {
      controller.signal.addEventListener("abort", () => {
        reject(AbortError);
      });

      document.querySelector("#torrent-quicksearch-msgnode").textContent =
        "Loading";
      let indexers = await getSelectedIndexers();

      document.querySelector("#torrent-quicksearch-msgnode").textContent =
        "Fetching Results From Indexers";
      let imdb = await setIMDBNode();
      setTitleNode();
      //reset count
      let count = [];
      let length = indexers.length;
      let data = [];
      let x = Number.MAX_VALUE;
      while (indexers.length) {
        // x at a time
        let newData = await Promise.allSettled(
          indexers
            .splice(0, Math.min(indexers.length, x))
            .map((e) => searchIndexer(e, imdb, length, count))
        );
        data = [...data, ...newData];
      }
      console.log(data);
      let errorMsgs = data
        .filter((e) => e["status"] == "rejected")
        .map((e) => e["reason"].message);
      errorMsgs = [...new Set(errorMsgs)];
      if (errorMsgs.length > 0) {
        reject(errorMsgs.join("\n"));
      }
      resolve();
    });
  },

  cancel() {
    controller.abort();
  },

  async setup() {
    this.searchPromise = new Promise((resolve, reject) => {
      this.timeout = setTimeout(async () => {
        try {
          resolve(await this.search());
        } catch (e) {
          reject(e);
        }
      }, 1000);
    });
  },

  async doSearch() {
    showDisplay();
    recreateController();
    resetConfig(filterconfig)
    await this.setup();

    setTimeout(() => {
      resetResultList();
      resetSearchDOM();
      getTableHead();
    }, 0);

    setTimeout(async () => {
      //reset
      sem = semaphore(10);

      try {
        await this.searchPromise;
        this.finalize();
      } catch (error) {
        if (error.message.match(/aborted!/i) === null) {
          GM.notification(error.message, program, searchIcon);
        }

        console.log(error);
      }
    }, 100);
  },
  finalize() {
    if (
      Array.from(document.querySelectorAll(".torrent-quicksearch-resultitem"))
        .length == 0
    ) {
      this.nomatchID = setTimeout(
        () =>
          (document.querySelector(
            "#torrent-quicksearch-resultlist"
          ).textContent = "No Matches"),
        1000
      );
    }
    this.finalmsgID = setTimeout(
      () =>
        (document.querySelector("#torrent-quicksearch-msgnode").textContent =
          "Finished"),
      1000
    );
    this.removemsgnodeID = setTimeout(() => {
      (document.querySelector("#torrent-quicksearch-msgnode").style.display =
        "none"),
        3000;
      document.querySelector("#torrent-quicksearch-msgnode").textContent = "";
    });
  },
  async toggleSearch() {
    let content = document.querySelector("#torrent-quicksearch-box");
    if (content.style.display === "block") {
      hideDisplay();
      searchObj.cancel();
    } else if (
      content.style.display === "none" ||
      content.style.display === ""
    ) {
      let customSearch = false;
      await this.doSearch();
    }
  },
};


function fetch(
  url,
  {
    method = "GET",
    data = null,
    headers = {},
    timeout = 90000,
    semaphore = true,
  } = {}
) {
  async function semforeFetch() {
    return new Promise((resolve, reject) => {
      sem.take(async () => {
        controller.signal.addEventListener("abort", () => {
          reject(AbortError);
        });
        setTimeout(() => reject(AbortError), timeout);
        GM.xmlHttpRequest({
          method: method,
          url: url,
          data: data,
          headers: headers,
          onload: (response) => {
            semaphoreLeave();
            resolve(response);
          },
          onerror: (response) => {
            semaphoreLeave();
            reject(response.responseText);
          },
        });
      });
    });
  }

  async function normalFetch() {
    return new Promise((resolve, reject) => {
      controller.signal.addEventListener("abort", () => {
        reject(AbortError);
      });
      setTimeout(() => reject(AbortError), timeout);
      GM.xmlHttpRequest({
        method: method,
        url: url,
        data: data,
        headers: headers,
        onload: (response) => {
          resolve(response);
        },
        onerror: (response) => {
          reject(response.responseText);
        },
      });
    });
  }

  if (semaphore) {
    return semforeFetch();
  } else {
    return normalFetch();
  }
}







function overideBuiltins() {
  URL = class extends URL {
    constructor(url, base) {
      if (url == undefined && base == undefined) {
        null;
      } else if (base != undefined && base.match(/(http|https)/) == null) {
        base = `http://${base}`;
      } else if (base == undefined && url.match(/(http|https)/) == null) {
        url = `http://${url}`;
      }
      super(url, base);
    }
  };
}

function safelyParseJSON (json) {
  // This function cannot be optimised, it's best to
  // keep it small!
  var parsed

  try {
    parsed = JSON.parse(json)
  } catch (e) {
    // Oh well, but whatever...
  }

  return parsed // Could be undefined!
}

