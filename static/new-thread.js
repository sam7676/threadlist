submit_thread_element = document.getElementById("submit-thread")
close_element = document.getElementById("close")

// Button listeners
submit_thread_element.addEventListener("click", submit_thread);
close_element.addEventListener("click", close_doc);

// POST request to send a new thread to the server
async function submit_thread() {
    title_box = document.getElementById("title-box")
    body_box = document.getElementById("body-box")

    thread_title = title_box.value
    thread_body = body_box.value

    title_box.value = ''
    body_box.value = ''

    promise = await fetch("./createnewthread",
    {
        headers: {
            'Content-Type': 'application/json'
        },
        method: "POST",
        body: JSON.stringify({
            "title": thread_title,
            "body": thread_body
        })
    })


    await window.parent.update_thread_display()

    close_doc()

}



// Closes the iFrame
function close_doc() {
    
    submit_thread_element.removeEventListener("click", submit_thread, true); // Succeeds
    close_element.removeEventListener("click", close_doc, true);
    window.parent.close_frame()
}
