import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

export default function RouteProgress(){
  const location = useLocation();
  const barRef = useRef(null);

  useEffect(()=>{
    const el = barRef.current;
    if(!el) return;
    el.style.display = 'block';
    el.style.width = '0%';
    requestAnimationFrame(()=>{ el.style.width = '70%'; });
    const done = () => {
      el.style.width = '100%';
      setTimeout(()=>{ el.style.display = 'none'; el.style.width='0%'; }, 200);
    };
    const t = setTimeout(done, 700);
    return ()=> clearTimeout(t);
  },[location.pathname]);

  return <div id="sx-topbar" ref={barRef} style={{display:'none'}}/>;
}




