/* global alert */

const threadId = window.parent.selected_thread;

const elementClose = document.getElementById('view-thread-close');
const elementDeleteThreadButton = document.getElementById('delete-thread');
const elementLikeThreadButton = document.getElementById('like-thread');
const elementDislikeThreadButton = document.getElementById('dislike-thread');
const elementGetComments = document.getElementById('get-comments');
const elementBackCommentPage = document.getElementById('back-comment-page');
const elementNextCommentPage = document.getElementById('next-comment-page');
const elementSubmitCommentButton = document.getElementById('submit-comment');

let formCommentPage = 1;
let maxCommentPage = 1;

elementClose.addEventListener('click', closeDoc);
elementDeleteThreadButton.addEventListener('click', deleteThread);
elementLikeThreadButton.addEventListener('click', likeThread);
elementDislikeThreadButton.addEventListener('click', dislikeThread);
elementGetComments.addEventListener('click', updateCommentDisplay);
elementBackCommentPage.addEventListener('click', decrementFormCommentPage);
elementNextCommentPage.addEventListener('click', incrementFormCommentPage);
elementSubmitCommentButton.addEventListener('click', submitComment);

let threadLikes = 0;

const COMMENT_BODY_INDEX = 1;
const COMMENT_ID_INDEX = 0;
const COMMENT_DATE_INDEX = 2;
const COMMENT_LIKES_INDEX = 3;
const COMMENT_IMAGE_INDEX = 5;

getThreadInfo();
updateCommentFormMax();
updateCommentDisplay();

// Gets information about the thread being displayed and updates HTML
async function getThreadInfo () {
    try {
        // Connecting to API
        const promise = await fetch('./threadinfo?' + new URLSearchParams({
            id: threadId
        }), { method: 'GET' });

        const result = await promise.json();
        threadLikes = result.likes;

        // Updating elements in HTML file
        document.getElementById('view-thread-title').innerHTML = result.title;
        document.getElementById('view-thread-body').innerHTML = result.body;
        document.getElementById('thread-date').innerHTML = window.parent.date_to_readable(result.date);
        document.getElementById('thread-last-update').innerHTML = window.parent.date_to_readable(result.lastupdate);
        document.getElementById('thread-likes').innerHTML = threadLikes;
    } catch {
        alert('Network error: /threadinfo failed to execute');
    }
}

// Deletes the thread
async function deleteThread () {
    try {
        // Sending API request
        await fetch('./deletethread',
            {
                headers: {
                    'Content-Type': 'application/json'
                },
                method: 'POST',
                body: JSON.stringify({
                    'thread-id': threadId
                })
            });
        // Request complete, update HTML display
        await window.parent.update_thread_display();
        closeDoc();
    } catch {
        alert('Network error: /deletethread failed to execute');
    }
}

// Likes/dislikes the thread (pre API call)
async function likeThread () {
    let success = false;
    success = await updateThreadLikes(1);
    if (success) {
        threadLikes = threadLikes + 1;
    document.getElementById('thread-likes').innerHTML = threadLikes;
    }
}
async function dislikeThread () {
    let success = false;
    success = await updateThreadLikes(-1);
    if (success) {
        threadLikes = threadLikes - 1;
    document.getElementById('thread-likes').innerHTML = threadLikes;
    }
}

// Likes/dislikes the thread
async function updateThreadLikes (val) {
    try {
        // Connecting to API
        await fetch('./likethread',
            {
                headers: {
                    'Content-Type': 'application/json'
                },
                method: 'POST',
                body: JSON.stringify({
                    'thread-id': threadId,
                    'like-number': val
                })
            });

        // API success, updating display
        window.parent.update_thread_display();
        return true;
    } catch {
        alert('Network error: /likethread failed to execute');
        return false;
    }
}

// Modifies the thread page we are currently on, and modifies the form_page attribute
function incrementFormCommentPage () {
    if (formCommentPage + 1 <= maxCommentPage) {
        formCommentPage = formCommentPage + 1;
    }
    updateCommentDisplay();
}
function decrementFormCommentPage () {
    if (formCommentPage - 1 >= 1) {
        formCommentPage = formCommentPage - 1;
    }
    updateCommentDisplay();
}

// Updates the page numbers for the thread page
function updateCommentFormMax () {
    document.getElementById('form-comment-page').innerHTML = formCommentPage;
    getCommentCount();
}

// Updates the table with data given
function updateCommentTable (data) {
    // Converting JSON to array
    const dataArr = [];
    for (const i in data) {
        const tempArr = [];
        for (const j in data[i]) {
            tempArr.push(data[i][j]);
        }
        dataArr.push(tempArr);
    }

    for (let i = 0; i < 5; i++) {
        const bodyElement = document.getElementById(`body-comment-${i + 1}`);
        const idElement = document.getElementById(`id-comment-${i + 1}`);
        const dateElement = document.getElementById(`date-comment-${i + 1}`);
        const likesElement = document.getElementById(`likes-comment-${i + 1}`);
        const divElement = document.getElementById(`image-div-${i + 1}`);
        const tableRow = document.getElementById(`comment-row-${i + 1}`);

        // Modifying HTML
        bodyElement.innerHTML = dataArr[i][COMMENT_BODY_INDEX];
        idElement.innerHTML = dataArr[i][COMMENT_ID_INDEX];
        dateElement.innerHTML = window.parent.date_to_readable(dataArr[i][COMMENT_DATE_INDEX]);
        likesElement.innerHTML = dataArr[i][COMMENT_LIKES_INDEX];

        // Displaying image is valid
        if (dataArr[i][COMMENT_IMAGE_INDEX] === '_') {
            divElement.innerHTML = `<label>${dataArr[i][5]}</label>`;
            divElement.style.display = 'none';
        } else {
            divElement.style.display = 'inherit';
            divElement.innerHTML = `<img src='${dataArr[i][5]}'>`;
        }

        const dislikeElement = document.getElementById(`dislike-comment-row${i + 1}`);
        const likeElement = document.getElementById(`like-comment-row${i + 1}`);
        const deleteElement = document.getElementById(`delete-comment-row${i + 1}`);

        // Not displaying invalid rows
        if (dataArr[i][COMMENT_ID_INDEX] === '_') {
            dislikeElement.innerHTML = '';
            likeElement.innerHTML = '';
            deleteElement.innerHTML = '';
            tableRow.style.display = 'none';
        } else {
            dislikeElement.innerHTML = '-';
            likeElement.innerHTML = '+';
            deleteElement.innerHTML = 'Delete';
            tableRow.style.display = 'initial';
        }
    }
}

// Updates which threads are currently shown to the user
async function updateCommentDisplay () {
    const selectOption = document.getElementById('sortby-comments');
    const selectValue = selectOption.options[selectOption.selectedIndex].value;
    const searchItem = document.getElementById('search-comments').value;

    try {
        // Connecting to API
        const promise = await fetch('./comments?' + new URLSearchParams({
            select: selectValue,
            search: searchItem,
            page: formCommentPage,
            'thread-id': threadId
        }), { method: 'GET' });

        // Updating HTML display
        const resultJson = await promise.json();
        updateCommentTable(resultJson);
        updateCommentFormMax();
    } catch {
        alert('Network error: /comments failed to execute');
    }
}

// Gets the number of pages of threads in the application
async function getCommentCount () {
    try {
        // Connecting to API
        const promise = await fetch('./getcommentcount?' + new URLSearchParams({
            'thread-id': threadId
        }), { method: 'GET' });

        // Updating max page
        const jsonObj = await promise.json();
        maxCommentPage = jsonObj.page_count;
        document.getElementById('max-comment-page').innerHTML = maxCommentPage;
    } catch {
        alert('Network error: /getcommentcount failed to execute');
    }
}

// Posts comment
async function submitComment () {
    // Creating form data
    const form = document.getElementById('submit-comment-form');
    const formData = new FormData(form);
    formData.append('thread-id', threadId);

    document.getElementById('new-comment-box').value = '';
    document.getElementById('upload-file').value = '';

    try {
        // Connecting to API
        const promise = await fetch('./addcomment',
            {
                method: 'POST',
                body: formData
            });

        const jsonObj = await promise.json();

        // Working through possible errors returned by backend
        if (jsonObj.error === 'content') {
            alert('No body/image provided');
        } else if (jsonObj.error === 'file') {
            alert('Filetype not supported');
        } else if (jsonObj.error === 'length') {
            alert('Comment length not in desired range');
        }

        // Updating display
        getLastThreadUpdate();
        await window.parent.update_thread_display();
        await updateCommentDisplay();
    } catch {
        alert('Network error: /addcomment failed to execute');
    }
}

// Like comment with the assigned number of likes (pre API call)
async function likeComment (pos, likes) {
    // Finds corresponding comment and current like count
    const commentId = document.getElementById(`id-comment-${pos}`).innerHTML;
    if (commentId === '_') {
        return;
    }
    const likeCountElement = document.getElementById(`likes-comment-${pos}`);
    const likeCount = parseInt(likeCountElement.innerHTML);

    // Updates display
    await updateCommentLikes(commentId, likes);
    likeCountElement.innerHTML = likeCount + likes;
    await updateCommentDisplay();
}

// Deletes comment (pre API call)
async function deleteCommentCheck (pos) {
    // Makes sure an empty page isn't displayed when the first element is deleted
    if (pos === 1 && formCommentPage > 1 && document.getElementById('id-comment-2').innerHTML === '_') {
        formCommentPage = formCommentPage - 1;
    }

    // Finds ID to delete
    const commentId = document.getElementById(`id-comment-${pos}`).innerHTML;
    if (commentId === '_') {
        return;
    }

    // Deletes comment and updates display
    await deleteComment(commentId);
    await window.parent.update_thread_display();
    await updateCommentDisplay();
}

// Updates the comment's likes
async function updateCommentLikes (id, val) {
    try {
        // Connects to API
        await fetch('./likecomment',
            {
                headers: {
                    'Content-Type': 'application/json'
                },
                method: 'POST',
                body: JSON.stringify({
                    'comment-id': id,
                    'like-number': val
                })
            });
    } catch {
        alert('Network error: /likecomment failed to execute');
    }
}

// Deletes comment
async function deleteComment (commentId) {
    try {
        // Connects to API
        await fetch('./deletecomment',
            {
                headers: {
                    'Content-Type': 'application/json'
                },
                method: 'POST',
                body: JSON.stringify({
                    'comment-id': commentId
                })
            });
    } catch {
        alert('Network error: /deletecomment failed to execute');
    }
}

// Modifies the element for when the thread was last updated
async function getLastThreadUpdate () {
    try {
        // Connects to API
        const promise = await fetch('./getlastupdate?' + new URLSearchParams({
            'thread-id': threadId
        }), { method: 'GET' });

        // Updates display
        const jsonObj = await promise.json();
        document.getElementById('thread-last-update').innerHTML = window.parent.date_to_readable(jsonObj.last_update);
    } catch {
        alert('Network error: /getlastupdate failed to return values');
    }
}

// Closes the iframe
function closeDoc () {
    // Closes all listeners
    elementClose.removeEventListener('click', closeDoc, true);
    elementDeleteThreadButton.removeEventListener('click', deleteThread, true);
    elementLikeThreadButton.removeEventListener('click', likeThread, true);
    elementDislikeThreadButton.removeEventListener('click', dislikeThread, true);
    elementGetComments.removeEventListener('click', updateCommentDisplay, true);
    elementBackCommentPage.removeEventListener('click', decrementFormCommentPage, true);
    elementNextCommentPage.removeEventListener('click', incrementFormCommentPage, true);
    elementSubmitCommentButton.removeEventListener('click', submitComment, true);

    window.parent.closeFrame();
}
