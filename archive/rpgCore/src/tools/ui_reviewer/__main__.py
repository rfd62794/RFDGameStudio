import sys
from .review_mode import run_review

def main():
    if len(sys.argv) < 2:
        print("Usage: python -m src.tools.ui_reviewer [scene_name|all]")
        return
        
    scene_name = sys.argv[1]
    
    if scene_name == "all":
        # Future: list all supported scenes
        scenes = ["garden"]
        for s in scenes:
            run_review(s)
    else:
        run_review(scene_name)

if __name__ == "__main__":
    main()
