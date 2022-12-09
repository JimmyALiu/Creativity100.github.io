/**
 * Name: Jimmy Liu
 * Date: 11.23.2022
 * Section: CSE 154 AA
 *
 * Front end code that handles the client side aspect of the website. Detects user input to make
 * fetch requests, adds rows/cols to the maze, and toggles the tiles between empty and wall.
 */

"use strict";

(function() {

  window.addEventListener("load", init);

  const MAX_BOARD_SIZE = 15;
  let boardSizeX = 1;
  let boardSizeY = 1;
  let board = [[false]]; // true = wall

  /**
   * function that is called when the DOM tree is fully loaded
   */
  function init() {
    resetBoard();
    id("add-row").addEventListener("click", addRow);
    id("add-col").addEventListener("click", addCol);
    id("solve").addEventListener("click", solveMaze);
    id("generate").addEventListener("click", generateMaze);
    id("reset").addEventListener("click", resetBoard);
  }

  /**
   * adds a new row to the maze with empty tiles
   */
  function addRow() {
    id("display-msg").classList.add("hidden");
    if (!(boardSizeY >= MAX_BOARD_SIZE)) {
      const newRow = [];
      for (let i = 0; i < boardSizeX; i++) {
        newRow.push(false);
      }
      board.push(newRow);

      const div = gen("div");
      for (let i = 0; i < boardSizeX; i++) {
        div.appendChild(makeBtn(i, boardSizeY));
      }

      id("maze").appendChild(div);
      boardSizeY++;
    }
  }

  /**
   * adds a new column to the maze with empty tiles
   */
  function addCol() {
    id("display-msg").classList.add("hidden");
    if (!(boardSizeX >= MAX_BOARD_SIZE)) {
      for (let i = 0; i < boardSizeY; i++) {
        board[i].push(false);
      }

      const divs = qsa("#maze div");
      for (let i = 0; i < boardSizeY; i++) {
        divs[i].appendChild(makeBtn(boardSizeX, i));
      }

      boardSizeX++;
    }
  }

  /**
   * solves the maze, and then highlights the shortest path in green
   */
  function solveMaze() {
    clearBoard();

    id("display-msg").classList.add("hidden");
    qs("main > section > p").innerHTML = "";
    const data = new FormData();
    data.append("board", board);
    data.append("width", board[0].length);
    data.append("height", board.length);

    fetch("/solve-maze", {method: "POST", body: data})
      .then(statusCheck)
      .then(res => res.text())
      .then(path => {
        if (path === "-1") {
          id("display-msg").classList.remove("hidden");
        } else {
          const coords = path.split(',');
          let i = 0;
          while (i < coords.length) {
            const x = Number(coords[i++]);
            const y = Number(coords[i++]);
            id(`${x}-${y}`).classList.add("path");
          }

        }
      })
      .catch(errorHandler);
  }

  /**
   * method responsible for generating a random maze and making
   * a fetch request to the API given optional size parameters
   */
  function generateMaze() {
    id("display-msg").classList.add("hidden");

    // get size
    let width = Number(id("size-x").value);
    let height = Number(id("size-y").value);

    // format URL
    let url = "";
    if ((width > 0 && width <= MAX_BOARD_SIZE) ||
      (height > 0 && height <= MAX_BOARD_SIZE)) {
      url += "?";
    }
    if (width > 0 && width <= MAX_BOARD_SIZE) {
      url += "sizeX=" + width;
    }
    if (height > 0 && height < MAX_BOARD_SIZE) {
      if (width > 0 && width < MAX_BOARD_SIZE) {
        url += "&";
      }
      url += "sizeY=" + height;
    }
    fetch("/generate-maze" + url)
      .then(statusCheck)
      .then(res => res.json())
      .then(obj => displayMaze(obj.array))
      .catch(errorHandler);
  }

  /**
   * takes in a 2d boolean array an displays that as a maze to the website
   *
   * @param {Array} arr -2d boolean array where false = empty tile and true = wall
   */
  function displayMaze(arr) {
    resetBoard();
    for (let y = 0; y < arr.length - 1; y++) {
      addRow();
    }
    for (let x = 0; x < arr[0].length - 1; x++) {
      addCol();
    }
    for (let y = 0; y < arr.length; y++) {
      for (let x = 0; x < arr[0].length; x++) {
        if (arr[y][x]) {
          board[y][x] = true;
          id(`${x}-${y}`).classList.add("wall");
        }
      }
    }
  }

  /**
   * resets the board to default state, a single tile
   */
  function resetBoard() {
    id("display-msg").classList.add("hidden");
    qs("#maze").innerHTML = "";
    const div = gen("div");
    const btn = gen("button");
    btn.id = "0-0";
    btn.classList.add("maze-btn");
    div.appendChild(btn);
    id("maze").appendChild(div);

    board = [[false]];
    boardSizeX = 1;
    boardSizeY = 1;
  }

  /**
   * clears all the tiles which have been highlighted with the path class
   */
  function clearBoard() {
    const paths = qsa(".path");
    for (let i = 0; i < paths.length; i++) {
      paths[i].classList.remove("path");
    }
  }

  /**
   * creates a new button with the correct class, id, and eventlistener
   *
   * @param {*} x - x position of button
   * @param {*} y - y position of button
   * @returns {HTMLElement} a new button
   */
  function makeBtn(x, y) {
    const btn = gen("button");
    btn.classList.add("maze-btn");
    btn.id = `${x}-${y}`;
    btn.addEventListener("click", toggleBtn);
    return btn;
  }

  /**
   * method toggles the state of a button (the tiles of the maze)
   * if it is a wall, it will change it to a movable space, if it
   * is a moveable space, it will change it to a wall
   */
  function toggleBtn() {
    this.classList.toggle("wall");
    const coords = this.id.split('-');
    board[coords[1]][coords[0]] = !board[coords[1]][coords[0]];

    if (this.classList.contains("wall") && this.classList.contains("path")) {
      clearBoard();
    }
  }

  /**
   * an asychronous function which checks the status of the API response. Throws and error to a
   * catch statement if there is something wrong the with API response
   *
   * @param {Promise} res - response from the api
   * @returns {Promise} the promise that was passed into it
   */
  async function statusCheck(res) {
    if (!res.ok) {
      throw new Error(await res.text());
    }
    return res;
  }

  /**
   * method that is responsible for elegantly handling when an error
   * occurs. Displays the error to the page
   *
   * @param {string} err - error message
   */
  function errorHandler(err) {
    const errorP = qs("main > section > p");
    errorP.textContent = err;
  }

  /**
   * searches for the HTML element with id
   *
   * @param {string} id - selector of the element
   * @returns {HTMLElement} element with that id
   */
  function id(id) {
    return document.getElementById(id);
  }

  /**
   * searches for the first HTML element with the selector
   *
   * @param {string} selector - selector of the element
   * @returns {HTMLElement} the first element that matches the selector
   */
  function qs(selector) {
    return document.querySelector(selector);
  }

  /**
   * searches for the all HTML element with the selector
   *
   * @param {string} selector - selector of the element
   * @returns {Array} all element that matches the selector
   */
  function qsa(selector) {
    return document.querySelectorAll(selector);
  }

  /**
   * creates a new element with <tagName>
   *
   * @param {string} tagName - the name of the tag to be created
   * @returns {HTMLElement} a new HTMLElement with tag <tagName>
   */
  function gen(tagName) {
    return document.createElement(tagName);
  }

})();