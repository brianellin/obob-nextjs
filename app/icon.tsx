import { ImageResponse } from "next/og";

// Route segment config
export const runtime = "edge";

// Image metadata
export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

// Image generation
export default function Icon() {
  return new ImageResponse(
    (
      // ImageResponse JSX element
      <div
        style={{
          fontSize: 24,
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ width: "90%", height: "90%" }}
        >
          <path
            d="M12 20V5.125H12.5556H13.6667H14.7778L15.3333 4.0625L15.8889 3H17.5556L19.2222 3.53125L20.3333 5.125L21.4444 6.71875L22 8.84375L20.8889 10.4375L20.3333 11.5V14.1562L19.2222 16.8125L17.5556 18.9375L14.7778 20H12Z"
            fill="#818181"
          />
          <path
            d="M11.25 16.25H12.75L12 17L11.25 16.25Z"
            stroke="black"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M16 14V14.5"
            stroke="black"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M4.42 11.247C4.14013 12.3277 3.999 13.4396 4 14.556C4 18.728 7.582 21 12 21C16.418 21 20 18.728 20 14.556C19.995 13.4351 19.829 12.3207 19.507 11.247"
            stroke="black"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M8 14V14.5"
            stroke="#050505"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M8.5 8.5C8.116 9.55 7.417 10.528 6.156 11C4.225 11.722 2.58 10.703 2.5 10C2.387 9.006 3.677 3.47 6.5 3C8.423 2.679 10.151 3.845 10.151 5.235C11.4158 4.91378 12.7425 4.92826 14 5.277C14 3.887 15.844 2.679 17.767 3C20.59 3.47 21.88 9.006 21.767 10C21.687 10.703 20.042 11.722 18.111 11C16.85 10.528 16.256 9.55 15.872 8.5"
            stroke="black"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    ),
    // ImageResponse options
    {
      ...size,
    }
  );
}
