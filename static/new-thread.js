/* global alert */

const submitThreadElement = document.getElementById('new-thread-submit');
const closeElement = document.getElementById('new-thread-close');

// Button listeners
submitThreadElement.addEventListener('click', submitThread);
closeElement.addEventListener('click', closeDoc);

// POST request to send a new thread to the server
async function submitThread () {
    const titleBox = document.getElementById('new-thread-title-box');
    const bodyBox = document.getElementById('new-thread-body-box');

    const threadTitle = titleBox.value;
    const threadBody = bodyBox.value;

    try {
        // API request
        const promise = await fetch('./createnewthread',
            {
                headers: {
                    'Content-Type': 'application/json'
                },
                method: 'POST',
                body: JSON.stringify({
                    title: threadTitle,
                    body: threadBody
                })
            });
        const jsonObj = await promise.json();

        // Error handling from server
        if (jsonObj.error === 'length') {
            alert('Thread title/body length not in range');
            return;
        }

        // Updating display
        titleBox.value = '';
        bodyBox.value = '';
        const newThreadId = jsonObj['thread-id'];
        await window.parent.updateThreadDisplay();
        postSuccess(newThreadId);
    } catch {
        alert('Network error: /createnewthread failed to execute');
    }
}

// Closes listeners and displays the given thread
function postSuccess (threadId) {
    window.parent.selectedThread = threadId;
    submitThreadElement.removeEventListener('click', submitThread, true); // Succeeds
    closeElement.removeEventListener('click', closeDoc, true);
    window.parent.viewThread();
}

// Closes the iFrame
function closeDoc () {
    submitThreadElement.removeEventListener('click', submitThread, true); // Succeeds
    closeElement.removeEventListener('click', closeDoc, true);
    window.parent.closeFrame();
}
