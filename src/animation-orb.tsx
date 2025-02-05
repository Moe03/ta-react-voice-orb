"use client";
import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { useOrbTheme } from "./providers/ThemeProvider"
import { useAIVoice } from "./providers/AIAudioProvider";

const AudioAnimationOrb = (props: {
  width: number;
  height: number;
  colorPallet?: string[];
  animationSensitivity?: number;
  orbPlaceholder?: React.ReactNode;
  children: React.ReactNode;
  showOrb: boolean;
}) => {

  const { webCall, callState, isMuted } = useAIVoice();
  const { getColor, customStyles } = useOrbTheme();
  const mountRef = useRef<HTMLDivElement>(null);

  // if (!webCall) {
  //   throw new Error("webCall is not found");
  // }
  // ======== Sensitivity factor ========
  const SENSITIVITY = props.animationSensitivity ?? 1.5; // Adjust this to increase or decrease overall responsiveness

  useEffect(() => {
    const scene = new THREE.Scene();
    // Calculate aspect ratio
    const aspect = props.width / props.height;

    // Define the size of the visible area
    const innerRadius = 2; // Circle radius
    const frustumHeight = innerRadius * 2; // Diameter of the circle
    const frustumWidth = frustumHeight * aspect;

    // Create an OrthographicCamera
    const camera = new THREE.OrthographicCamera(
      -frustumWidth / 2,
      frustumWidth / 2,
      frustumHeight / 2,
      -frustumHeight / 2,
      -1000,
      1000
    );
    camera.position.z = 0;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(props.width, props.height);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current?.appendChild(renderer.domElement);

    // Audio context and analyser
    const audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const outerSegments = 1024;

    // Circle geometry
    const innerGeometry = new THREE.CircleGeometry(innerRadius, outerSegments);

    const innerMaterial = new THREE.ShaderMaterial({
      vertexShader: `
        uniform float time;
        varying vec2 vUv;
        varying vec3 vPosition;
        // Now we'll receive an array of 4 colors
        uniform vec3 uColor[4];
        varying vec3 vColor;

        uniform float uFreqData;
        uniform float freqInfluencedTime;

        // Simplex noise utility functions
        vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
        vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

        float snoise(vec3 v){ 
          const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
          const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

          vec3 i  = floor(v + dot(v, C.yyy) );
          vec3 x0 =   v - i + dot(i, C.xxx);

          vec3 g = step(x0.yzx, x0.xyz);
          vec3 l = 1.0 - g;
          vec3 i1 = min( g.xyz, l.zxy );
          vec3 i2 = max( g.xyz, l.zxy );

          vec3 x1 = x0 - i1 + 1.0 * C.xxx;
          vec3 x2 = x0 - i2 + 2.0 * C.xxx;
          vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;

          i = mod(i, 289.0 ); 
          vec4 p = permute( permute( permute( 
                        i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
                      + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
                      + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

          float n_ = 1.0/7.0;
          vec3  ns = n_ * D.wyz - D.xzx;

          vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

          vec4 x_ = floor(j * ns.z);
          vec4 y_ = floor(j - 7.0 * x_ );
          vec4 x = x_ *ns.x + ns.yyyy;
          vec4 y = y_ *ns.x + ns.yyyy;
          vec4 h = 1.0 - abs(x) - abs(y);

          vec4 b0 = vec4( x.xy, y.xy );
          vec4 b1 = vec4( x.zw, y.zw );

          vec4 s0 = floor(b0)*2.0 + 1.0;
          vec4 s1 = floor(b1)*2.0 + 1.0;
          vec4 sh = -step(h, vec4(0.0));

          vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
          vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

          vec3 p0 = vec3(a0.xy,h.x);
          vec3 p1 = vec3(a0.zw,h.y);
          vec3 p2 = vec3(a1.xy,h.z);
          vec3 p3 = vec3(a1.zw,h.w);

          vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
          p0 *= norm.x;
          p1 *= norm.y;
          p2 *= norm.z;
          p3 *= norm.w;

          vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
          m = m * m;
          return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), 
                                        dot(p2,x2), dot(p3,x3) ) );
        }

        void main() {
          float frequencyInfluence = uFreqData * 0.005;
          float modified_time = freqInfluencedTime;

          vUv = uv;

          vec2 noiseCoord = uv * vec2(3.0, 4.0);
          float noise = snoise(vec3(noiseCoord, modified_time * 0.3));
      
          float distToCenter = length(uv - 0.5) * 2.0;
          float influence = smoothstep(0.9, 0.8, distToCenter); 
      
          float displacement = influence * sin(vUv.x * 5.0 + freqInfluencedTime * 1.0) * 0.05 * uFreqData / 30.0;
          displacement += influence * cos(vUv.y * 5.0 + freqInfluencedTime * 1.5) * 0.05 * uFreqData / 30.0;

          vec3 pos = vec3(position.x, position.y + displacement, position.z - abs(displacement));

          // Start from a neutral color instead of one of the array colors
          vColor = vec3(0.0);

          // Incorporate all 4 colors
          for (int i = 0; i < 4; i++) {
              float noiseFlow = 5.0 + float(i) * 0.3;
              float noiseSpeed = 10.0 + float(i) * 0.3;
              float noiseSeed = 1.0 + float(i) * 10.0;
              vec2 noiseFreq = vec2(0.3, 0.4);
              float noiseFloor = 0.1;
              float noiseCeil = 0.6 + float(i) * 0.07;

              float localNoise = smoothstep(
                  noiseFloor,
                  noiseCeil,
                  snoise(vec3(
                      noiseCoord * noiseFreq + vec2(modified_time * noiseFlow, modified_time * noiseSpeed),
                      noiseSeed
                  ))
              );

              // Mix each color in
              vColor = mix(vColor, uColor[i], localNoise);
          }
      
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        varying vec2 vUv;
        varying vec3 vPosition;
        varying vec3 vColor;
        uniform float freqInfluencedTime;

        void main() {
            gl_FragColor = vec4(vColor, 1.0);
        }
      `,
      side: THREE.DoubleSide,
      uniforms: {
        time: { value: 0.0 },
        uFreqData: { value: 0.0 },
        // Change to 4 colors in the shader
        uColor: {
          value: [
            new THREE.Color().set(getColor("primary-500")),
            new THREE.Color().set(getColor("primary-800")),
            new THREE.Color().set(getColor("primary-200")),
            new THREE.Color().set(getColor("primary-600")),
          ],
        },
        resolution: { value: new THREE.Vector4() },
        freqInfluencedTime: { value: 0.0 },
      },
      transparent: true,
    });

    const innerCircle = new THREE.Mesh(innerGeometry, innerMaterial);
    scene.add(innerCircle);

    // Green spot
    const smallerInnerGeometry = new THREE.CircleGeometry(
      innerRadius,
      outerSegments
    );

    const greenMaterial = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec2 vUv;
        uniform float uTime;
        uniform float uFreqData;
        void main() {
          vUv = uv;
          vec3 pos = position;

          float distToCenter = length(vUv - 0.5);
          float influence = smoothstep(0.5, 0.45, distToCenter);

          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        uniform float uTime;
        uniform float uFreqData;
        uniform float uMargin;
        uniform float uOpacity; 
        uniform vec3 uSpotColor; 

        vec4 permute(vec4 x) {
            return mod(((x*34.0)+1.0)*x, 289.0);
        }

        float perlinNoise(vec2 p) {
            vec2 i = floor(p);
            vec2 f = fract(p);

            vec4 v = vec4(
                dot(i, vec2(127.1, 311.7)),
                dot(i + vec2(1.0, 0.0), vec2(127.1, 311.7)),
                dot(i + vec2(0.0, 1.0), vec2(127.1, 311.7)),
                dot(i + vec2(1.0, 1.0), vec2(127.1, 311.7))
            );

            v = fract(sin(v) * 43758.5453123);
            vec2 u = f * f * (3.0 - 2.0 * f);

            return mix(
              mix(v.x, v.y, u.x),
              mix(v.z, v.w, u.x),
              u.y
            );
        }

        void main() {
            vec2 centeredUv = vUv - 0.5;
            float distToCenter = length(centeredUv);

            float maxRadius = 0.5 - uMargin;
            float dynamicRadius = maxRadius;
            float normalizedFreq = (uFreqData / 256.0);

            float noiseScale = 3.0;
            float adjustedTime = uTime * 0.1;
            float edgeNoise = perlinNoise(centeredUv * noiseScale + adjustedTime);
            edgeNoise = smoothstep(normalizedFreq, 1.0, edgeNoise);

            float noisyRadius = dynamicRadius - edgeNoise * 0.2;
            float edge = smoothstep(noisyRadius - 0.03, noisyRadius + 0.03, distToCenter);

            vec3 spotColor = uSpotColor;
            float alpha = (1.0 - edge) * uOpacity;

            if (uMargin == 0.0) {
                alpha = uOpacity * (1.0 - smoothstep(0.5 - 0.001, 0.5, distToCenter));
            }

            gl_FragColor = vec4(spotColor, alpha);
        }
      `,
      uniforms: {
        uTime: { value: 0.0 },
        uFreqData: { value: 0.0 },
        uMargin: { value: 0.0001 },
        uOpacity: { value: 0.3 },
        uSpotColor: { value: new THREE.Color().set(getColor("primary-100")) },
      },
      transparent: true,
    });

    const InnerCircle = new THREE.Mesh(smallerInnerGeometry, greenMaterial);
    scene.add(InnerCircle);
    InnerCircle.position.z = 0.01;

    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      analyser.getByteFrequencyData(dataArray);
      // Calculate average frequency and scale by SENSITIVITY
      let freqData =
        dataArray.reduce((acc, value) => acc + value, 0) / dataArray.length;
      freqData *= SENSITIVITY; // Apply sensitivity here

      // Update uniforms
      innerMaterial.uniforms.time.value += 0.0005;
      innerMaterial.uniforms.freqInfluencedTime.value +=
        0.0001 + freqData * 0.00001;
      innerMaterial.uniforms.uFreqData.value = freqData;

      greenMaterial.uniforms.uTime.value += 0.05;
      greenMaterial.uniforms.uFreqData.value = freqData;

      renderer.render(scene, camera);
    };

    let source: MediaStreamAudioSourceNode;
    let stream: MediaStream;

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((s) => {
        stream = s;
        source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        animate();
      })
      .catch((err) => {
        console.error("Failed microphone access: ", err);
      });

    // Handle window resize
    const handleResize = () => {
      if (!mountRef.current) return;

      const aspect = props.width / props.height;
      const frustumHeight = innerRadius * 2;
      const frustumWidth = frustumHeight * aspect;

      camera.left = -frustumWidth / 2;
      camera.right = frustumWidth / 2;
      camera.top = frustumHeight / 2;
      camera.bottom = -frustumHeight / 2;
      camera.updateProjectionMatrix();

      renderer.setSize(props.width, props.height);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      // Cancel animation loop
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }

      // Remove event listener
      window.removeEventListener("resize", handleResize);

      // Clean up WebGL
      if (mountRef.current) {
        try {
          mountRef.current.removeChild(renderer.domElement);
        } catch (error) {
          console.error(`error removing dom element`, error);
        }
      }
      renderer.dispose();

      // Stop audio streams/tracks immediately
      if (stream) {
        console.log(`stopping stream`);
        stream.getTracks().forEach((track) => track.stop());
      } else {
        console.log(`stream not found`);
      }

      // Disconnect audio source if exists
      if (source) {
        console.log(`disconnecting source`);
        source.disconnect();
      } else {
        console.log(`source not found`);
      }

      // Close the audio context
      audioContext
        .close()
        .catch((err) => console.error("Error closing audioContext: ", err));
    };
  }, [customStyles, props.width, props.height, props.showOrb]);

  return (
    <div
      className="ta-orb-wrapper"
      style={{ position: "relative", width: props.width, height: props.height }}
    >
      <div
        className="ta-orb-container"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
        }}
      >
        {props.children}
      </div>
      {props.showOrb ? (
        <div
          className="ta-orb-placeholder"
          ref={mountRef}
          style={{ width: props.width, height: props.height }}
        />
      ) : (
        props.orbPlaceholder
      )}
    </div>
  );
};

export default AudioAnimationOrb;
