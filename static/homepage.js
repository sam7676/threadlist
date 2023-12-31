/* global alert */

// Initialising the page and adding listeners
let formPage = 1;
let maxPage = 1;
let selectedThread = null;
const frame = document.getElementById('extra-content');

updateFormMax();
updateThreadDisplay();

document.getElementById('get-threads').addEventListener('click', updateThreadDisplay);
document.getElementById('new-thread').addEventListener('click', showNewThread);
document.getElementById('backthread').addEventListener('click', decrementFormPage);
document.getElementById('nextthread').addEventListener('click', incrementFormPage);

const THREAD_ID_INDEX = 0;
const THREAD_TITLE_INDEX = 1;
const THREAD_DATES_INDEX = 3;
const THREAD_UPDATE_INDEX = 4;
const THREAD_LIKES_INDEX = 5;
const THREAD_COMMENTS_INDEX = 6;
const HEART_UNICODE = '❤';
const COMMENT_UNICODE = '🗨';
const HIDDEN_CHAR = '⁠&#8288;';

// Converts a one or two-digit number into a two-digit string.
function makeDoubleDigit (s) {
    if (s === '_') {
        return s;
    }
    const t = s.toString();
    if (t.length === 1) {
        return '0'.concat(t);
    } else {
        return t;
    }
}

// Increments/decrements the thread page we are currently on, and modifies the formPage attribute
function incrementFormPage () {
    if (formPage + 1 <= maxPage) {
        formPage = formPage + 1;
    }
    updateThreadDisplay();
}
function decrementFormPage () {
    if (formPage - 1 >= 1) {
        formPage = formPage - 1;
    }
    updateThreadDisplay();
}

// Updates the page numbers for the thread page
async function updateFormMax () {
    document.getElementById('formpage').innerHTML = formPage;
    getPageCount();
}

// Updates the table with data given
function updateTable (data) {
    // Creating array to work through
    const dataArr = [];
    for (const i in data) {
        const tempArr = [];
        for (const j in data[i]) {
            tempArr.push(data[i][j]);
        }
        dataArr.push(tempArr);
    }

    const table = document.getElementById('thread-table');
    const rows = table.rows;

    for (let i = 1; i < rows.length; i++) {
        // Checking if thread is valid
        let valid = false;
        if (dataArr[i - 1][THREAD_ID_INDEX] !== '_') {
            valid = true;
        }

        // If valid, display all as normal, otherwise invisible
        if (valid) {
            rows[i].cells[0].innerHTML = dataArr[i - 1][THREAD_TITLE_INDEX];
            rows[i].cells[1].innerHTML = dataArr[i - 1][THREAD_ID_INDEX];
            rows[i].cells[2].innerHTML = dateToReadable(dataArr[i - 1][THREAD_DATES_INDEX]);
            rows[i].cells[3].innerHTML = dateToReadable(dataArr[i - 1][THREAD_UPDATE_INDEX]);
            rows[i].cells[4].innerHTML = addChar(HEART_UNICODE, dataArr[i - 1][THREAD_LIKES_INDEX]);
            rows[i].cells[5].innerHTML = addChar(COMMENT_UNICODE, dataArr[i - 1][THREAD_COMMENTS_INDEX]);
        } else {
            rows[i].cells[0].innerHTML = HIDDEN_CHAR;
            rows[i].cells[1].innerHTML = '_';
            rows[i].cells[2].innerHTML = HIDDEN_CHAR;
            rows[i].cells[3].innerHTML = HIDDEN_CHAR;
            rows[i].cells[4].innerHTML = HIDDEN_CHAR;
            rows[i].cells[5].innerHTML = HIDDEN_CHAR;
        }
    }
}

// Updates which threads are currently shown to the user
async function updateThreadDisplay () {
    // Ensuring form page <= max page
    await getPageCount();
    if (formPage > maxPage) {
        formPage = maxPage;
    }

    const selectOption = document.getElementById('sortby');
    const selectValue = selectOption.options[selectOption.selectedIndex].value;
    const searchItem = document.getElementById('search').value;

    try {
        // API call
        const promise = await fetch('./threads?' + new URLSearchParams({
            select: selectValue,
            search: searchItem,
            page: formPage
        }), { method: 'GET' });

        // Updating table and display
        const resultJson = await promise.json();
        updateTable(resultJson);
        updateFormMax();
    } catch {
        alert('Network error: /threads failed to return values');
    }
}

// Gets the number of pages of threads in the application
async function getPageCount () {
    try {
        // API call
        const promise = await fetch('./getpagecount', { method: 'GET' });
        const jsonObj = await promise.json();

        // Updates max page and display
        maxPage = jsonObj.page_count;
        document.getElementById('maxpage').innerHTML = maxPage;
    } catch {
        alert('Network error: /getpagecount failed to return a value');
    }
}

// If a thread is clicked on, selects the thread and triggers the viewThread script
function selectRow (row) {
    const rowID = 'row'.concat(row.toString());
    const rowElement = document.getElementById(rowID);
    selectedThread = rowElement.cells[1].innerHTML;
    if (selectedThread === '_') {
        alert('Cannot select invalid thread');
    } else {
        viewThread();
    }
}

// Converts a date string object (returned from the backend) into a more readable format
function dateToReadable (str) {
    if (str === '_') {
        return str;
    }
    const arr = str.split('-');

    // YEAR MONTH DAY HOURS MINUTES SECONDS
    //    0     1   2     3       4       5
    for (let i = 0; i < arr.length; i++) {
        arr[i] = parseInt(arr[i]);

        // Setting a few items to double digit for presentation's sake
        if (i >= 1 && i <= 4) {
            arr[i] = makeDoubleDigit(arr[i]);
        }
    }
    return `${arr[1]}/${arr[2]}/${arr[0]} ${arr[3]}:${arr[4]}`;
}

// Inserts a character at the beginning of a string
function addChar (c, str) {
    if (str === '_') {
        return str;
    }
    return c.concat(' ', str);
}

// Creates a new thread and loads the new thread HTML document
function showNewThread () {
    try {
        frame.src = './new-thread.html';
    } catch {
        alert('Network error: new-thread.html unable to be fetched');
    }
}

// Views a thread, using the selectedThread variable
function viewThread () {
    try {
        frame.src = './view-thread.html';
    } catch {
        alert('Network error: view-thread.html unable to be fetched');
    }
}

// Clears the extra content frame
function closeFrame () {
    frame.src = 'about:blank';
    selectedThread = null;
}
