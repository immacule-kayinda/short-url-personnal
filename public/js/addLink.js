const form = document.querySelector("form");
const cancelButton = document.querySelector("#cancelBtn");
const destinationField = document.querySelector("#destination");
const customBackHalf = document.querySelector("#custom_back_half");

console.log("qjmdfskj");

console.log(destinationField, customBackHalf);

async function checkIfTheCustomBackHalfExists(backHalf) {
  try {
    const response = await fetch("/Ourlink/" + backHalf, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.status === 200;
  } catch (error) {
    console.log("error" + error);
    return false;
  }
}

async function checkIfTheLinkExist(link) {
  try {
    const response = await fetch(link, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    console.log(response);
    return response.status === 200;
  } catch (error) {
    console.log("error" + error);
    return false;
  }
}

customBackHalf.addEventListener("blur", async function (event) {
  const backHalf = event.target.value;
  const response = await checkIfTheCustomBackHalfExists(backHalf);
  console.log(response);
  if (backHalf) {
    if (await checkIfTheCustomBackHalfExists(backHalf))
      destinationField.classList.add("is-invalid");
    else destinationField.classList.remove("is-invalid");
  } else destinationField.classList.remove("is-invalid");
  console.log(destinationField);
});

destinationField.addEventListener("blur", async function (event) {
  const link = event.target.value;
  document.body.color = "red";
  const response = await checkIfTheLinkExist(link);
  console.log(response);
  if (link) {
    if (await checkIfTheLinkExist(link)) {
      destinationField.classList.add("is-invalid");
    } else {
      destinationField.classList.remove("is-invalid");
    }
  } else {
    destinationField.classList.remove("is-invalid");
  }
});

cancelButton.addEventListener("click", (event) => {
  event.preventDefault();
  form.reset();
});

// function that will be called when we gonna submit the form. The function will handle the behavior of post the entries to the url "/create" with POST parameters

const addLink = async (data) => {
  console.log(data);
  try {
    const response = await fetch("/create-link", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    console.log(response);
    if (response.ok) {
      form.reset();
      cancelButton.disabled = false;
      createBtn.disabled = false;
      // window.location.href = "/";
    }
  } catch (err) {
    console.error(err);
  }
};

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const createBtn = event.target.querySelector("#createBtn");
  createBtn.disabled = true;
  cancelButton.disabled = true;
  const formData = new FormData(event.target);
  const data = Object.fromEntries(formData.entries());
  const createQR = event.target.querySelector("#createQR");
  data.createQR = createQR.checked;
  await addLink(data);
  event.target.reset();
});
