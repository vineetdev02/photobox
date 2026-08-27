import { useState } from "react";

import { ImageViewer, useImageViewer, type ViewerImage } from "../src/index.js";

const DownloadIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M12 3v12M7 11l5 5 5-5M4 21h16" />
  </svg>
);

const ids = [1015, 1016, 1018, 1019, 1024, 1025, 1027, 1029, 1033, 1035, 1039, 1043, 1044];
const groups = ["Outdoors", "Outdoors", "Outdoors", "Outdoors", "Indoors", "Indoors", "Indoors", "Indoors", "Indoors", "Indoors", "Facilities", "Facilities", "Facilities"];
const titles = ["Elevation", "Entrance", "Podium", "Skyline", "Living room", "Kitchen", "Master bedroom", "Bathroom", "Study", "Balcony", "Clubhouse", "Pool", "Gym"];

const images: ViewerImage[] = ids.map((id, i) => ({
  src: `https://picsum.photos/id/${id}/1400/900`,
  thumbnail: `https://picsum.photos/id/${id}/240/160`,
  title: titles[i],
  group: groups[i],
  alt: `${groups[i]} — ${titles[i]}`,
}));

export function App() {
  const viewer = useImageViewer();
  const [minimal, setMinimal] = useState(false);
  const [light, setLight] = useState(false);

  return (
    <div className="wrap">
      <h1>Image viewer</h1>
      <p className="lede">
        {images.length} images across 3 groups. Click a tile, or use the buttons to open a
        configuration.
      </p>

      <div className="row">
        <button onClick={() => { setMinimal(false); setLight(false); viewer.openAt(0); }}>
          Everything on
        </button>
        <button onClick={() => { setMinimal(true); setLight(false); viewer.openAt(0); }}>
          Minimal (props off)
        </button>
        <button onClick={() => { setMinimal(false); setLight(true); viewer.openAt(4); }}>
          Light theme
        </button>
      </div>

      <div className="grid">
        {images.map((image, i) => (
          <button key={image.src} className="tile" onClick={() => viewer.openAt(i)}>
            <img src={image.thumbnail} alt={image.alt} />
          </button>
        ))}
      </div>

      <ImageViewer
        {...viewer.props}
        images={images}
        theme={light ? "light" : "dark"}
        groups={!minimal}
        thumbnails={!minimal}
        feedback={!minimal}
        toolbar={!minimal}
        counter={minimal}
        // download — hidden for now, coming in a later update
        slideshow
        allGroupsTab
        actions={
          minimal
            ? []
            : [
                { id: "brochure", label: "Brochure", href: "#brochure", icon: <DownloadIcon />, compact: true, onClick: (c) => console.log("brochure", c.image.title) },
                { id: "more", label: "Request more photos", primary: true, onClick: (c) => console.log("more", c.index) },
              ]
        }
        onFeedback={(value, c) => console.log("feedback", value, c.image.title)}
      />
    </div>
  );
}
