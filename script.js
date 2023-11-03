window.onload = function() {
  window.scrollTo({
    top: 0,
    left: 0,
    behavior: 'smooth'
  });
}

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if(entry.isIntersecting) {
      entry.target.classList.add("show");
    }
  });
});

const hiddenElements = document.querySelectorAll(".hidden");
hiddenElements.forEach((el) => observer.observe(el));

// rehiding elements
const observeHead = new IntersectionObserver(() => {
  hiddenElements.forEach((el) => {
    el.classList.remove("show");
  })
})
const headerEl = document.querySelector("#top");
observeHead.observe(headerEl)