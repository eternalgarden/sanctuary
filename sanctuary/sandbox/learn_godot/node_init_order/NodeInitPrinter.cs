using Godot;
using System;

public partial class NodeInitPrinter : Node
{
    public override void _EnterTree()
    {
        if (this.Name == "root")
        {
            GD.Print(this.GetTreeStringPretty());
        }
        
        GD.Print(this.Name + " entered tree!");
    }
    
    public override void _Ready()
    {
        GD.Print(this.Name + " ready!");
    }
}
