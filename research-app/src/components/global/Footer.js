
export default function Footer() {
  return (
    <footer className="bg-gray-800 mt-auto">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-sm font-semibold text-qut-light tracking-wider uppercase">About</h3>
            <ul className="mt-4 space-y-4">
              <li><a href="https://www.qut.edu.au/research/centre-for-data-science" className="text-base text-qut-light hover:qut-text-secondary">Centre for Data Science</a></li>
              <li><a href="https://www.qut.edu.au" className="text-base text-qut-light hover:qut-text-secondary">QUT Home</a></li>
              <li><a href="https://www.qut.edu.au/research" className="text-base text-qut-light hover:qut-text-secondary">Research at QUT</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-qut-light tracking-wider uppercase">Resources</h3>
            <ul className="mt-4 space-y-4">
              <li><a href="#" className="text-base text-qut-light hover:qut-text-secondary">Help Centre</a></li>
              <li><a href="#" className="text-base text-qut-light hover:qut-text-secondary">Data Sources</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-qut-light tracking-wider uppercase">Legal</h3>
            <ul className="mt-4 space-y-4">
              <li><a href="https://www.qut.edu.au/additional/copyright" className="text-base text-qut-light hover:qut-text-secondary">Copyright</a></li>
              <li><a href="https://www.qut.edu.au/additional/privacy" className="text-base text-qut-light hover:qut-text-secondary">Privacy</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-qut-light tracking-wider uppercase">Connect</h3>
            <ul className="mt-4 space-y-4">
              <li><a href="https://www.qut.edu.au/contact" className="text-base text-qut-light hover:qut-text-secondary">Contact Us</a></li>
              <li><a href="#" className="text-base text-qut-light hover:qut-text-secondary">Feedback</a></li>
              <li className="flex space-x-6">
                <a title="Link to Twitter (X)" href="https://twitter.com/qut" className="text-qut-light hover:qut-text-secondary">
                  <i className="fab fa-twitter"></i>
                </a>
                <a title="Link to linkedin" href="https://www.linkedin.com/school/queensland-university-of-technology/" className="text-qut-light hover:qut-text-secondary">
                  <i className="fab fa-linkedin"></i>
                </a>
                <a title="Link to github" href="https://github.com/qut" className="text-qut-light hover:qut-text-secondary">
                  <i className="fab fa-github"></i>
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-gray-700 pt-8 md:flex md:items-center md:justify-between">
          <div className="flex space-x-6 md:order-2">
            <a title="Link to facebook" href="https://www.facebook.com/QUT" className="text-qut-light hover:qut-text-secondary">
              <i className="fab fa-facebook-f"></i>
            </a>
            <a title="Link to Instagram" href="https://www.instagram.com/qutrealworld/" className="text-qut-light hover:qut-text-secondary">
              <i className="fab fa-instagram"></i>
            </a>
            <a title="Link to YouTube" href="https://www.youtube.com/user/TheQUTube" className="text-qut-light hover:qut-text-secondary">
              <i className="fab fa-youtube"></i>
            </a>
          </div>
          <p className="mt-8 text-base text-qut-light md:mt-0 md:order-1">
            &copy; 2025 Queensland University of Technology. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}