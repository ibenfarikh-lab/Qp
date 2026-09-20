'use client';
export default function CategoryList({categories=[],activeCategory,onSelectCategory}){return <div className="category-chips">{categories.map((k,i)=><button key={k} className={activeCategory===k?'chip-btn active':'chip-btn'} onClick={()=>onSelectCategory(k)}>{i===0?'🏠':'📦'}<span>{k}</span></button>)}</div>}
