import "../../styles/ui/Input.css"

function Input({ className = "", ...props }) {
  return <input className={`input ${className}`} {...props} />
}

export default Input

